// Harness route table: only the three source-component pages. /contact is a static fixture, not a component.
import type {ComponentType} from 'react';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import ProjectsPage from './ProjectsPage';
export const pages: Record<string, ComponentType> = {'/': HomePage, '/about': AboutPage, '/projects': ProjectsPage};
