/*
 * @Author: Libra
 * @Date: 2025-03-06 20:51:40
 * @LastEditors: Libra
 * @Description:
 */
const icons: Record<string, any> = {};

if (typeof window !== "undefined") {
  const context = (require as any).context(
    "@/assets/svgs/skills",
    false,
    /\.svg$/
  );

  context.keys().forEach((key: string) => {
    const iconName = key.replace(/^\.\//, "").replace(/\.svg$/, "");
    icons[iconName] = () => import(`@/assets/svgs/skills/${key.slice(2)}`);
  });
}

export { icons };
