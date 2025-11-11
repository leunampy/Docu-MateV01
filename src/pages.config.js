import Home from './pages/Home';
import GenerateDocument from './pages/GenerateDocument';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CompileDocument from './pages/CompileDocument';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "GenerateDocument": GenerateDocument,
    "Profile": Profile,
    "Settings": Settings,
    "CompileDocument": CompileDocument,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};