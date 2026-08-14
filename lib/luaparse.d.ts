/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "luaparse" {
  export interface LuaParseOptions {
    locations?: boolean;
    ranges?: boolean;
  }
  export function parse(code: string, options?: LuaParseOptions): any;
}
