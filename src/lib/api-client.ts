const GITHUB_PAGES_API = process.env.NEXT_PUBLIC_API_URL || "";

export function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".github.io")) {
    return `${GITHUB_PAGES_API}${path}`;
  }
  return path;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = getApiUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "请求失败" }));
    throw new Error(error.message || `API错误: ${res.status}`);
  }
  return res.json();
}
