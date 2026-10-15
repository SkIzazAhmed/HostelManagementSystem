
  import { createRoot } from "react-dom/client";
  import App from "./app/App.jsx";
  import "./styles/index.css";
  import { captureUtm } from "./utm";

  captureUtm();

  createRoot(document.getElementById("root")).render(<App />);
