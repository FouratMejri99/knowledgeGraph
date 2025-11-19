import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Webview Frontend Extension is now active!");

  const disposable = vscode.commands.registerCommand(
    "webviewFrontend.openWebview",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "myWebview",
        "My Frontend Webview",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      // Load your frontend dev server in an iframe
      panel.webview.html = getWebviewContent();

      // Handle messages from frontend
      panel.webview.onDidReceiveMessage(
        (message) => {
          if (message.command === "buttonClicked") {
            vscode.window.showInformationMessage("Button clicked in frontend!");
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  const devServerUrl = "http://localhost:5173"; // Update to your dev URL

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Frontend Webview</title>
      <style>
        html, body, iframe { margin: 0; padding: 0; height: 100%; width: 100%; }
        iframe { border: none; }
      </style>
    </head>
    <body>
      <iframe src="${devServerUrl}"></iframe>
    </body>
    </html>
  `;
}

export function deactivate() {}
