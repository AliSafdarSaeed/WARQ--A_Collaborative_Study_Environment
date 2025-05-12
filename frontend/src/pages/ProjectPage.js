import React, { useState } from "react";
import ProjectCreate from "../components/ProjectCreate";
import ProjectList from "../components/ProjectList";

const ProjectPage = () => {
  const [refresh, setRefresh] = useState(false);

  // Trigger refresh after creating a project
  const handleProjectCreated = () => setRefresh((r) => !r);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">My Study Projects</h1>
      <div className="mb-8">
        <ProjectCreate onProjectCreated={handleProjectCreated} />
      </div>
      <ProjectList refresh={refresh} />
    </div>
  );
};

export default ProjectPage;

