export class Shorthand {
  public constructor(private readonly value: number) {}

  public read(): number {
    return this.value;
  }
}

export class Declared {
  private readonly value: number;

  public constructor(value: number) {
    this.value = value;
  }

  public read(): number {
    return this.value;
  }
}
