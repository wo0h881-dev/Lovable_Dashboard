export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const action = url.searchParams.get("action") ?? "getTodayCombined";

  const appsScriptUrl = context.env.APPS_SCRIPT_URL;
  const token = context.env.APPS_SCRIPT_TOKEN;

  if (!appsScriptUrl || !token) {
    return new Response(
      JSON.stringify({ error: "Missing server environment variables" }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }

  const target = new URL(appsScriptUrl);
  target.searchParams.set("action", action);
  target.searchParams.set("token", token);

  const res = await fetch(target.toString());

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=120",
    },
  });
};
