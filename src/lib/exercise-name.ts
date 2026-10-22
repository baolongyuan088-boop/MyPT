const names: Record<string, string> = {
  "push-up":"俯卧撑", "incline-push-up":"上斜俯卧撑", "decline-push-up":"下斜俯卧撑", "diamond-push-up":"钻石俯卧撑", "wide-push-up":"宽距俯卧撑",
  "pull-up":"引体向上", "inverted-row":"桌边反向划船", "superman":"俯卧超人式", "reverse-snow-angel":"俯卧反向划臂",
  "squat":"深蹲", "lunge":"弓步蹲", "jump-squat":"跳跃深蹲", "wall-sit":"靠墙静蹲", "bulgarian-split-squat":"保加利亚分腿蹲", "pistol-squat":"单腿深蹲", "glute-bridge":"臀桥", "single-leg-glute-bridge":"单腿臀桥", "calf-raise":"提踵", "step-up":"踏台阶",
  "plank":"平板支撑", "side-plank":"侧平板支撑", "reverse-plank":"反向平板支撑", "crunch":"卷腹", "bicycle-crunch":"自行车卷腹", "leg-raise":"仰卧举腿", "mountain-climber":"登山跑", "russian-twist":"俄罗斯转体", "hollow-hold":"仰卧空心支撑", "v-up":"两头起", "bird-dog":"鸟狗式",
  "chair-tricep-dip":"椅边臂屈伸", "pike-push-up":"折刀俯卧撑", "wall-handstand-hold":"靠墙倒立支撑", "jumping-jack":"开合跳", "burpee":"波比跳", "high-knee":"高抬腿", "thruster":"徒手深蹲上推",
};
export function exerciseName(e: { slug?: string | null; nameEn?: string | null; nameTr?: string | null } | null | undefined, locale: string): string {
  if (!e) return "—";
  return (locale === "zh" ? names[e.slug ?? ""] ?? e.nameEn : locale === "en" ? e.nameEn : e.nameTr) ?? "—";
}
export const categoriesZh: Record<string, string> = { chest:"胸部", back:"背部", legs:"腿部", core:"核心", arms:"手臂", shoulder:"肩部", cardio:"有氧", fullbody:"全身" };
