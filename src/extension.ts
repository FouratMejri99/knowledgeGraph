import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "myExtension.openView",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "myView",
        "My React Webview",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(
              path.join(context.extensionPath, "webview", "dist")
            ),
          ],
        }
      );

      const indexPath = path.join(
        context.extensionPath,
        "webview",
        "dist",
        "index.html"
      );
      let html = fs.readFileSync(indexPath, "utf8");

      const baseUri = (panel.webview as any).asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, "webview", "dist"))
      );
      html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, src) => {
        if (src.startsWith("http") || src.startsWith("data:")) return m;
        return `${attr}="${baseUri}/${src}"`;
      });

      panel.webview.html = html;
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
