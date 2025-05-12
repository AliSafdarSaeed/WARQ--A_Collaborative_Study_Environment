import React, { useEffect, useState } from "react";
import { getProjects } from "../services/api";
import ProjectCard from "./ProjectCard";

const ProjectList = ({ refresh }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data || []);
      } catch (err) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [refresh]);

  if (loading) return <div className="text-center">Loading projects...</div>;
  if (!projects.length) return <div className="text-center text-gray-500">No projects found.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
};

export default ProjectList;