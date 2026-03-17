export function baixarArquivo(response: any) {
  const blob = new Blob([response.data]);

  const contentDisposition = response.headers["content-disposition"];
  let fileName = "resultado.xlsx";

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.+)"?/);
    if (match?.[1]) {
      fileName = match[1];
    }
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
}
