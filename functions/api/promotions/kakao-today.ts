import kakaoData from "../../../public/data/kakao-promotions-today.json";

export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify(kakaoData), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
