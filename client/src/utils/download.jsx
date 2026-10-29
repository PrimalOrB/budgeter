// save a PDF the server sent as { blob: base64, filename }
export async function savePdf({ blob, filename }, fallbackName = "report.pdf") {
  const response = await fetch(`data:application/pdf;base64,${blob}`);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || fallbackName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 0);
}
