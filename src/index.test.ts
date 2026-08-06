import { versaoDoContrato } from "./index";

describe("versaoDoContrato", () => {
  it("diz qual a versao do contrato", () => {
    expect(versaoDoContrato()).toBe(1);
  });
});
