
window.addEventListener("DOMContentLoaded", (event) => {
    const dropArea = document.getElementById('drop-area');
    if (dropArea) {
      // Prevent default behavior (opening the file in the browser)
      dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropArea.classList.add('highlight'); // Optional visual feedback
      });

      dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
      });

      dropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropArea.classList.remove('highlight');

        const files = event.dataTransfer.files;
        handleFiles(files);
      });
    }
});

function handleFiles(files) {
  // Process the uploaded files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    alert(file.name); // Example: Log the file name

    // Perform upload logic (e.g., using FormData and XMLHttpRequest)
    // ...
  }
}
