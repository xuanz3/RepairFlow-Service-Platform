# README Product Media

The repository home page uses a manually curated product walkthrough stored under `docs/images/product/`.

The published v1 set contains ten reviewed screenshots:

- seven desktop workflow views;
- three mobile workflow views.

The root README references those files directly. Product screenshots are documentation and are not generated or replaced as part of the blocking release gate.

The root README retains the existing `product-media:start` and `product-media:end` HTML comments as repository validation anchors around the curated walkthrough. They are compatibility markers only; the v1 release flow does not use them to generate screenshots.

Legacy Playwright, Maestro, Mermaid and Sharp capture tooling remains available as optional source tooling for future non-blocking media work. Its historical capture manifest is separate from the curated README set and must not rewrite the repository home page automatically.

Any future README media update should preserve the following rules:

1. keep the final curated set at fifteen images or fewer;
2. use stable descriptive filenames;
3. include a short explanation for every displayed image;
4. use fictional or generated customer/device data only;
5. keep media generation independent from package creation and release verification.
