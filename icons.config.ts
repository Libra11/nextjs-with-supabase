/*
 * @Author: Libra
 * @Date: 2025-03-06 20:51:40
 * @LastEditors: Libra
 * @Description:
 */
// 创建一个空的图标对象，用于存储所有的SVG图标
const icons: Record<string, any> = {};

// 仅在浏览器环境下执行
if (typeof window !== "undefined") {
  // 使用require.context动态导入所有SVG文件
  // @/assets/svgs/skills - 指定SVG文件所在目录
  // false - 不搜索子目录
  // /\.svg$/ - 只匹配.svg后缀的文件
  const context = (require as any).context(
    "@/assets/svgs/skills",
    false,
    /\.svg$/
  );

  // 遍历所有匹配的SVG文件
  context.keys().forEach((key: string) => {
    // 处理文件名:
    // 1. 移除开头的 './'
    // 2. 移除.svg后缀
    // 得到纯文件名作为图标名
    const iconName = key.replace(/^\.\//, "").replace(/\.svg$/, "");

    // 为每个图标创建一个动态import函数
    // key.slice(2)移除文件名开头的'./'
    icons[iconName] = () => import(`@/assets/svgs/skills/${key.slice(2)}`);
  });
}

// 导出icons对象供其他模块使用
export { icons };
