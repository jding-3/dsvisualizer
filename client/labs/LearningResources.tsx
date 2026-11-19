import { BookOpen, ChevronDown, Code2, PlayCircle } from 'lucide-react'
import resources from './learning-resources.json'

export function LearningResources() {
  return <details className="learning-resources">
    <summary><BookOpen size={17} /> Learn more <ChevronDown size={16} /></summary>
    <div className="learning-topics">
      {Object.entries(resources).map(([topic, { reference, video, code }]) => (
        <section key={topic}>
          <h2>{topic}</h2>
          <ul>
            <li><a href={reference.url} target="_blank" rel="noreferrer"><BookOpen size={15} /><span>{reference.title}<small>Wikipedia reference</small></span></a></li>
            <li><a href={video.url} target="_blank" rel="noreferrer"><PlayCircle size={15} /><span>{video.title}<small>MIT OpenCourseWare · YouTube</small></span></a></li>
            <li><a href={code.url} target="_blank" rel="noreferrer"><Code2 size={15} /><span>{code.title}<small>The Algorithms · GitHub</small></span></a></li>
          </ul>
        </section>
      ))}
    </div>
  </details>
}
