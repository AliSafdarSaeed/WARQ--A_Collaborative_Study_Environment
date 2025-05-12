import React from "react";

const ProjectCard = ({ project }) => (
  <div className="bg-white shadow rounded p-4">
    <h3 className="text-lg font-bold">{project.title}</h3>
    <p className="text-gray-700">{project.description}</p>
    <div className="text-sm text-gray-500 mb-2">{project.subject}</div>
    <div className="mb-2">
      {project.tags && project.tags.map((tag) => (
        <span
          key={tag}
          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
        >
          {tag}
        </span>
      ))}
    </div>
    <div className="text-xs text-gray-400">
      Created by: {project.createdBy?.name || "Unknown"}
    </div>
  </div>
);

export default ProjectCard;