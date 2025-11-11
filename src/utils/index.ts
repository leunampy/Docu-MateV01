


export function createPageUrl(pageName: string) {
    // Special case: Home should return "/"
    if (pageName.toLowerCase() === "home") {
        return "/";
    }
    
    // Convert camelCase/PascalCase to kebab-case
    // e.g., "GenerateDocument" -> "generate-document"
    const kebabCase = pageName
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Add dash between lowercase and uppercase
        .toLowerCase()
        .replace(/ /g, '-'); // Replace spaces with dashes
    return '/' + kebabCase;
}