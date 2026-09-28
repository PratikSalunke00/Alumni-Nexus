import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";


createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />


    </Routes>
  </BrowserRouter>
);

