export type MenuOption = {
  name: string;
  choiceLabel: string;
  priceDelta: number;
  isDefault?: boolean;
};

export function resolveSelectedOptions(options: MenuOption[], selectedLabels?: string[]) {
  const labels =
    selectedLabels && selectedLabels.length > 0
      ? selectedLabels
      : options.filter((o) => o.isDefault).map((o) => o.choiceLabel);

  const selected = labels
    .map((label) => options.find((o) => o.choiceLabel === label))
    .filter((o): o is MenuOption => Boolean(o));

  const unitPriceDelta = selected.reduce((sum, o) => sum + o.priceDelta, 0);
  return {
    optionLabels: selected.map((o) => o.choiceLabel),
    unitPriceDelta,
    choices: selected.map((o) => ({ groupName: o.name, choiceLabel: o.choiceLabel, priceDelta: o.priceDelta }))
  };
}

export function groupMenuOptions(options: MenuOption[]) {
  const groups = new Map<string, Array<{ choiceLabel: string; priceDelta: number; isDefault?: boolean }>>();
  for (const option of options) {
    const list = groups.get(option.name) ?? [];
    list.push({ choiceLabel: option.choiceLabel, priceDelta: option.priceDelta, isDefault: option.isDefault });
    groups.set(option.name, list);
  }
  return Array.from(groups.entries()).map(([name, choices]) => ({ name, choices }));
}

export function resolveServerLinePricing(
  basePrice: number,
  options: MenuOption[],
  optionLabels?: string[]
) {
  const resolved = resolveSelectedOptions(options, optionLabels);
  const unitPrice = basePrice + resolved.unitPriceDelta;
  return {
    unitPrice,
    optionsSnapshot:
      resolved.choices.length > 0
        ? { choices: resolved.choices }
        : undefined
  };
}
