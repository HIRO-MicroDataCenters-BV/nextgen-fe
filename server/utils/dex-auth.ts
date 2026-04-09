import https from "node:https";

interface DexAuthConfig {
    host: string;
    username: string;
    password: string;
    authType: string;
    skipTlsVerify: boolean;
}

/**
 * Programmatically login to DEX and obtain authservice_session cookie
 * Based on the authentication architecture documented in the project
 */
export async function getDexSessionCookie(): Promise<string> {
    const config = useRuntimeConfig();

    const dexConfig: DexAuthConfig = {
        host: config.dexHost as string,
        username: config.dexUsername as string,
        password: config.dexPassword as string,
        authType: (config.dexAuthType as string) || "local",
        skipTlsVerify: config.skipTlsVerify !== false,
    };

    // Validate configuration
    if (!dexConfig.host || !dexConfig.username || !dexConfig.password) {
        throw createError({
            statusCode: 500,
            statusMessage: "DEX configuration is incomplete",
            data: {
                hasHost: !!dexConfig.host,
                hasUsername: !!dexConfig.username,
                hasPassword: !!dexConfig.password,
            },
        });
    }

    // Cookie storage
    const cookies = new Map<string, string>();

    // Custom fetch options with TLS verification control
    const fetchOptions: RequestInit = {
        redirect: "manual", // Handle redirects manually to track URLs
    };

    // Add HTTPS agent if TLS verification should be skipped
    if (dexConfig.skipTlsVerify) {
        const agent = new https.Agent({
            rejectUnauthorized: false,
        });
        (fetchOptions as Record<string, unknown>).agent = agent;
    }

    // Helper to extract and store cookies from response
    const extractCookies = (response: Response) => {
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        setCookieHeaders.forEach((cookieStr) => {
            const [nameValue] = cookieStr.split(";");
            if (!nameValue) return;
            const [name, value] = nameValue.split("=");
            if (name && value) {
                cookies.set(name.trim(), value.trim());
            }
        });
    };

    // Helper to format cookies for Cookie header
    const formatCookies = (): string => {
        return Array.from(cookies.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");
    };

    // Helper to perform fetch with cookies
    const fetchWithCookies = async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        const cookieHeader = formatCookies();
        const headers = new Headers(options.headers);
        if (cookieHeader) {
            headers.set("Cookie", cookieHeader);
        }

        const response = await fetch(url, {
            ...fetchOptions,
            ...options,
            headers,
        });

        extractCookies(response);
        return response;
    };

    try {
        // Step 1: Initial GET to host - follow redirects manually
        let currentUrl = dexConfig.host;
        let response = await fetchWithCookies(currentUrl);

        // Follow redirects manually
        while (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) break;

            // Handle relative URLs
            currentUrl = location.startsWith("http")
                ? location
                : new URL(location, currentUrl).toString();

            response = await fetchWithCookies(currentUrl);
        }

        // Step 2: If we got 403, try /oauth2/start
        if (response.status === 403) {
            const url = new URL(currentUrl);
            const redirectUrl = new URL("/oauth2/start", url.origin);
            redirectUrl.searchParams.set("rd", url.pathname);

            response = await fetchWithCookies(redirectUrl.toString());

            // Follow redirects
            while (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location");
                if (!location) break;
                currentUrl = location.startsWith("http")
                    ? location
                    : new URL(location, currentUrl).toString();
                response = await fetchWithCookies(currentUrl);
            }
        }

        // Step 3: Navigate to auth type specific login
        currentUrl = response.url || currentUrl;
        const urlObj = new URL(currentUrl);

        // If we're at /auth, append the auth type
        if (urlObj.pathname.endsWith("/auth")) {
            urlObj.pathname = `${urlObj.pathname}/${dexConfig.authType}`;
            currentUrl = urlObj.toString();
        }

        // If not at login page, navigate there
        if (!urlObj.pathname.match(/\/auth\/.*\/login$/)) {
            response = await fetchWithCookies(currentUrl);

            // Follow redirects
            while (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location");
                if (!location) break;
                currentUrl = location.startsWith("http")
                    ? location
                    : new URL(location, currentUrl).toString();
                response = await fetchWithCookies(currentUrl);
            }
        }

        const dexLoginUrl = response.url || currentUrl;

        // Step 4: POST login credentials
        const loginData = new URLSearchParams({
            login: dexConfig.username,
            password: dexConfig.password,
        });

        response = await fetchWithCookies(dexLoginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: loginData.toString(),
        });

        // Follow post-login redirects
        let redirectCount = 0;
        while (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) break;

            currentUrl = location.startsWith("http")
                ? location
                : new URL(location, dexLoginUrl).toString();

            response = await fetchWithCookies(currentUrl);
            redirectCount++;

            if (redirectCount > 10) {
                throw new Error("Too many redirects during login");
            }
        }

        // Check if login was successful (should have redirected)
        if (redirectCount === 0) {
            throw new Error("DEX login failed: no redirect happened");
        }

        // Step 5: Handle approval step if needed
        currentUrl = response.url || currentUrl;
        if (currentUrl.endsWith("/approval")) {
            const approvalData = new URLSearchParams({
                approval: "approve",
            });

            response = await fetchWithCookies(currentUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: approvalData.toString(),
            });

            // Follow approval redirects
            while (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location");
                if (!location) break;
                currentUrl = location.startsWith("http")
                    ? location
                    : new URL(location, currentUrl).toString();
                response = await fetchWithCookies(currentUrl);
            }
        }

        // Step 6: Extract and return cookie header
        const cookieHeader = formatCookies();

        if (!cookieHeader || cookieHeader.length === 0) {
            throw new Error("No session cookie obtained from DEX");
        }

        return cookieHeader;
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: "DEX authentication failed",
            data: {
                error: error instanceof Error ? error.message : String(error),
                host: dexConfig.host,
                username: dexConfig.username,
            },
        });
    }
}
