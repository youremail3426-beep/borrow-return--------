export const getDisplayImageUrl = (url: string) => {
    if (!url) return '';
    const driveMatch = url.match(/drive\.google\.com\/uc\?export=view&id=(.+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    return url;
};
