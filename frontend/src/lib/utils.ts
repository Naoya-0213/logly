// 日本時間（JST）の今日の日付を返す
export const getTodayJST = (): string => {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
};

// 日本時間（JST）のDateオブジェクトを返す
export const getNowJST = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
};