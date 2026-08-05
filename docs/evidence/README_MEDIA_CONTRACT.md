# README Media Contract

The capture command will update only the text between these markers:

- `<!-- product-media:start -->`
- `<!-- product-media:end -->`

The script must:

1. Reset to fixed sample data.
2. Capture all named flows.
3. Remove temporary captures.
4. Compose the 18 approved files.
5. Validate dimensions and file sizes.
6. Replace the README media block.
7. Fail when a required image is missing or an unexpected final image exists.
