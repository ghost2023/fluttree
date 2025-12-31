# fluttree

`fluttree` is a command-line tool for visualizing the internal dependency graph of a Flutter project. It traverses your Dart files, starting from `lib/main.dart`, and builds a map of how they import each other. It can also identify unused Dart files within your project.

The output can be generated in several formats suitable for visualization:
-   **JSON**: A structured representation of the graph.
-   **DOT**: For use with Graphviz.
-   **Mermaid**: For rendering graphs in Markdown.

## Installation

### From Source

You can build and install the `fluttree` binary using the provided Makefile.

**Prerequisites:**
*   [Bun](https://bun.sh/)
*   `make`

1.  **Build the binary:**
    ```bash
    make build
    ```
    This will create an executable file at `dist/fluttree`.

2.  **Install the binary:**
    ```bash
    sudo make install
    ```
    This will move the binary to `/usr/local/bin`, making it available system-wide.

### For Development

If you want to run the tool directly from the source without building, first install the dependencies:

```bash
bun install
```

Then you can run it via `bun`:

```bash
bun run index.ts -- [args]
```

## Usage

Once installed, you can run `fluttree` from within your Flutter project's root directory.

```bash
fluttree [options]
```

### Options

*   `--rootPath <path>`: The path to the root of your Flutter project. Defaults to the current directory (`./`).
*   `-o, --output <file>`: The file to write the output to. The format is determined by the file extension. Defaults to `graph.json`.

### Examples

*   **Generate a DOT file for Graphviz:**
    ```bash
    fluttree -o dependency-graph.dot
    ```

*   **Generate a Mermaid graph:**
    ```bash
    fluttree -o dependency-graph.mmd
    ```

*   **Generate a JSON representation:**
    ```bash
    fluttree -o dependency-graph.json
    ```

*   **Analyze a project in a different directory:**
    ```bash
    fluttree --rootPath /path/to/another/flutter-project -o graph.dot
    ```

## Uninstall

To remove the `fluttree` binary from your system:

```bash
sudo make uninstall
```
