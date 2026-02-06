/**
 * Image API Utilities
 * Helper functions for fetching images from various APIs
 */

// Pexels API (Free tier - 200 requests/hour)
const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY'; // You can get it from https://www.pexels.com/api/

// Unsplash API (Free tier - 50 requests/hour)
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // You can get it from https://unsplash.com/developers

/**
 * Get image from Pexels API
 */
export const getPexelsImage = async (query: string, width: number = 200, height: number = 200): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
        },
      }
    );
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium || data.photos[0].src.large;
    }
  } catch (error) {
    console.error('Pexels API error:', error);
  }
  // Fallback to Unsplash Source API (no key required)
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
};

/**
 * Get image from Unsplash API
 */
export const getUnsplashImage = async (query: string, width: number = 200, height: number = 200): Promise<string> => {
  try {
    if (UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY') {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return `${data.results[0].urls.regular}&w=${width}&h=${height}&fit=crop`;
      }
    }
  } catch (error) {
    console.error('Unsplash API error:', error);
  }
  // Fallback to Unsplash Source API (no key required)
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
};

/**
 * Get image from Pixabay API (Free tier - unlimited requests)
 */
export const getPixabayImage = async (query: string, width: number = 200, height: number = 200): Promise<string> => {
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=YOUR_PIXABAY_API_KEY&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`
    );
    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      return data.hits[0].webformatURL || data.hits[0].largeImageURL;
    }
  } catch (error) {
    console.error('Pixabay API error:', error);
  }
  // Fallback to Unsplash Source API (no key required)
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
};

/**
 * Get service-specific image with optimized search terms
 * Uses Unsplash Source API for high-quality images
 */
export const getServiceImage = async (
  category: string,
  title: string,
  width: number = 200,
  height: number = 200
): Promise<string> => {
  // Map categories to optimized search terms for better image results
  const categoryMap: Record<string, string> = {
    flight: 'airplane flight travel aviation sky clouds blue white',
    hotel: 'hotel resort accommodation luxury building architecture modern elegant',
    restaurant: 'restaurant food dining cuisine meal delicious restaurant interior gourmet',
    activity: 'activity adventure fun entertainment outdoor sports recreation exciting',
  };

  const searchTerm = categoryMap[category] || `${category} ${title}`;

  // Use Unsplash Source API (no API key needed, provides high-quality images)
  // Format: https://source.unsplash.com/{width}x{height}/?{keywords}
  // Using consistent hash to get same image each time
  try {
    // Create consistent hash from category and title to get same image
    const hash = `${category}_${title}`.split('').reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return ((acc << 5) - acc) + code;
    }, 0);
    const imageUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(searchTerm)}&sig=${Math.abs(hash)}`;
    return imageUrl;
  } catch (error) {
    console.error('Error getting service image:', error);
    // Ultimate fallback with placeholder
    return `https://via.placeholder.com/${width}x${height}/E60012/FFFFFF?text=${encodeURIComponent(title)}`;
  }
};

/**
 * Get quick action image with optimized search terms
 */
export const getQuickActionImage = async (
  category: string,
  title: string,
  width: number = 80,
  height: number = 80
): Promise<string> => {
  // Map categories to optimized search terms for better image results
  const categoryMap: Record<string, string> = {
    'booking+reservation': 'booking reservation calendar appointment schedule date time',
    'trip+travel': 'trip travel journey adventure explore destination map',
    'review+rating': 'review rating star feedback comment testimonial',
    'profile+user': 'profile user person account avatar portrait headshot',
  };

  const searchTerm = categoryMap[category] || `${category} ${title}`;

  // Use Unsplash Source API
  // Using consistent hash to get same image each time
  try {
    // Create consistent hash from category and title to get same image
    const hash = `${category}_${title}`.split('').reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return ((acc << 5) - acc) + code;
    }, 0);
    const imageUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(searchTerm)}&sig=${Math.abs(hash)}`;
    return imageUrl;
  } catch (error) {
    console.error('Error getting quick action image:', error);
    return `https://via.placeholder.com/${width}x${height}/E60012/FFFFFF?text=${encodeURIComponent(title)}`;
  }
};

/**
 * Get batch images for multiple services
 */
export const getBatchServiceImages = async (
  services: Array<{ category: string; title: string }>,
  width: number = 200,
  height: number = 200
): Promise<Record<string, string>> => {
  const imagesMap: Record<string, string> = {};
  
  await Promise.all(
    services.map(async (service) => {
      const imageUrl = await getServiceImage(service.category, service.title, width, height);
      imagesMap[service.category] = imageUrl;
    })
  );

  return imagesMap;
};

