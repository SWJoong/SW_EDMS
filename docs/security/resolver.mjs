// Node ESM resolve hook: 확장자 없는 상대 import( './mockData' )를 .ts 로 해석.
// Vite 는 기본 처리하지만 Node 런타임은 확장자를 요구하므로, 보안 테스트 실행용으로만 사용.
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    try { return await next(specifier + '.ts', context); } catch { /* fall through */ }
  }
  return next(specifier, context);
}
