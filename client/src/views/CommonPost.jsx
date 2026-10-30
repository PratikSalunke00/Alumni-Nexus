
import { useState } from "react";
import StudentNavbar from "../components/StudentNavbar.jsx";

const CommonPost = () => {
  const [post, setPost] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <StudentNavbar />
      <div className="mx-auto max-w-3xl">

        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          Community Posts
        </h1>

        <p className="mb-6 text-gray-500">
          Share updates and connect with students and alumni.
        </p>

      
        {/* Empty Posts Section */}
        <div className="mt-6 rounded-xl border bg-white p-10 text-center shadow-sm">
          <h2 className="font-semibold text-gray-700">
            No Posts Yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Be the first to share something with the community!
          </p>
        </div>

      </div>
    </div>
  );
};

export default CommonPost;
