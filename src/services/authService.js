import api, {
  STORAGE_USER_KEY,
  STORAGE_TOKEN_KEY,
  STORAGE_REFRESH_TOKEN_KEY,
} from "./api";

// Backend Auth Endpoints (FastAPI)
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  SIGNIN: "/auth/signin",
  PROFILE: "/auth/profile",
  REFRESH: "/auth/refresh",
};

/**
 * Helper to extract user-friendly error string from FastAPI/Pydantic errors
 */
export function formatErrorMessage(err, defaultMsg = "An unexpected error occurred.") {
  if (!err) return defaultMsg;
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const msgs = detail.map((d) => (d.msg ? d.msg.replace(/^Value error, /, "") : JSON.stringify(d)));
    return msgs.join(". ");
  }
  return err.response?.data?.message || err.message || defaultMsg;
}

/**
 * Raw Auth API Client calling FastAPI endpoints directly
 */
export const authApi = {
  // 1. POST /api/v1/auth/login
  login: async ({ email_address, password }) => {
    const res = await api.post(AUTH_ENDPOINTS.LOGIN, {
      email_address,
      password,
    });
    return res.data;
  },

  // 2. POST /api/v1/auth/signin (Register real user)
  signin: async ({ name, email_address, password, phone_number }) => {
    const payload = {
      name: name?.trim() || null,
      email_address: email_address?.trim().toLowerCase(),
      password,
      phone_number: phone_number?.trim() || null,
    };
    const res = await api.post(AUTH_ENDPOINTS.SIGNIN, payload);
    return res.data;
  },

  // 3. GET /api/v1/auth/profile
  profile: async () => {
    const res = await api.get(AUTH_ENDPOINTS.PROFILE);
    return res.data;
  },

  // 4. POST /api/v1/auth/refresh
  refresh: async (refresh_token) => {
    const res = await api.post(AUTH_ENDPOINTS.REFRESH, {
      refresh_token,
    });
    return res.data;
  },

  // 5. POST /api/v1/auth/logout
  logout: async (refresh_token) => {
    const res = await api.post(AUTH_ENDPOINTS.LOGOUT, {
      refresh_token,
    });
    return res.data;
  },
};

/**
 * Get current authenticated user from localStorage
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get current active JWT access token
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Login user helper that hits real backend /auth/login and stores tokens
 */
export async function loginUser({ email, password, remember = true }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Please enter your email address.");
  }
  if (!password) {
    throw new Error("Please enter your password.");
  }

  try {
    const response = await authApi.login({
      email_address: cleanEmail,
      password,
    });

    const tokenData = response.data;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Save tokens in localStorage
    localStorage.setItem(STORAGE_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, refreshToken);
    }

    // Fetch user profile using the new Bearer token
    let userProfile = null;
    try {
      const profileRes = await authApi.profile();
      userProfile = profileRes.data;
    } catch (profileErr) {
      console.warn("Could not fetch user profile details:", profileErr);
    }

    const userData = {
      id: userProfile?.user_id || "auth_user",
      name: userProfile?.name || cleanEmail.split("@")[0].replace(/[._-]/g, " "),
      email: userProfile?.email || cleanEmail,
      role: userProfile?.role || "user",
      department: "Enterprise",
      token: accessToken,
    };

    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
    return userData;
  } catch (err) {
    const errorMsg = formatErrorMessage(err, "Authentication failed. Please check your credentials.");
    throw new Error(errorMsg);
  }
}

/**
 * Register a real user with original credentials via /auth/signin, then log them in
 */
export async function signupUser({ name, email, password, phone_number = null }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanName) {
    throw new Error("Please enter your full name.");
  }
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }
  if (!password || password.length < 8) {
    throw new Error("Password must be between 8 and 128 characters long.");
  }

  try {
    // 1. Create original user in PostgreSQL
    await authApi.signin({
      name: cleanName,
      email_address: cleanEmail,
      password,
      phone_number: phone_number || null,
    });

    // 2. Automatically log the newly registered user in to get active JWT tokens
    return await loginUser({
      email: cleanEmail,
      password,
      remember: true,
    });
  } catch (err) {
    const errorMsg = formatErrorMessage(err, "Account creation failed. Please check your details.");
    throw new Error(errorMsg);
  }
}

/**
 * Logout user: invalidates refresh token on backend and clears local storage
 */
export async function logoutUser() {
  try {
    const refreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
  } catch (err) {
    console.warn("Backend logout notification warning:", err);
  } finally {
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
    } catch (e) {
      console.warn("Error clearing auth storage:", e);
    }
  }
}

/**
 * Fetch profile helper that calls the /auth/profile endpoint
 */
export async function fetchProfile() {
  try {
    const res = await authApi.profile();
    return res.data;
  } catch (err) {
    return null;
  }
}
