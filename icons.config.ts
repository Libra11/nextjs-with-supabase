/*
 * @Author: Libra
 * @Date: 2025-03-06 20:51:40
 * @LastEditors: Libra
 * @Description:
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const icons: Record<string, any> = {};

// 仅在浏览器环境下执行
if (typeof window !== "undefined") {
  // 使用 require.context 动态导入所有 SVG 文件
  const context = (require as unknown as {
    context: (
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp
    ) => {
      keys: () => string[];
      <T>(key: string): T;
    };
  }).context("@/assets/svgs/skills", false, /\.svg$/);

  context.keys().forEach((key: string) => {
    const iconName = key.replace(/^\.\//, "").replace(/\.svg$/, "");
    icons[iconName] = () => import(`@/assets/svgs/skills/${key.slice(2)}`);
  });
}

export { icons };
