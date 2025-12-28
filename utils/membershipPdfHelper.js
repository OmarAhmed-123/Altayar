/**
 * Membership PDF Helper
 * Handles linking PDF files to memberships based on membership name
 */

const path = require('path');
const fs = require('fs').promises;

// Membership name to PDF file mapping
const MEMBERSHIP_PDF_MAP = {
  'business': 'BusinessMembership',
  'diamond': 'DiamondMembership',
  'gold': 'GoldMembership',
  'platinum': 'PlatinumMembership',
  'silver': 'SilverMembership',
  'vip': 'VIPMembership'
};

// Arabic name to tier mapping
const ARABIC_NAME_TO_TIER = {
  'برونزية': 'bronze',
  'برونزي': 'bronze',
  'فضية': 'silver',
  'فضي': 'silver',
  'ذهبية': 'gold',
  'ذهبي': 'gold',
  'بلاتينية': 'platinum',
  'بلاتيني': 'platinum',
  'vip': 'vip',
  'في اي بي': 'vip',
  'الماسية': 'diamond',
  'الماسي': 'diamond',
  'الألماس': 'diamond',
  'تجارية': 'business',
  'تجاري': 'business',
  'أعمال': 'business'
};

/**
 * Find PDF file for a membership based on its name and/or tier
 * @param {string} membershipName - The name of the membership
 * @param {string} membershipTier - The tier of the membership (optional, more reliable)
 * @returns {Promise<string|null>} - Path to PDF file or null if not found
 */
async function findMembershipPDF(membershipName, membershipTier = null) {
  const membershipsDir = path.join(__dirname, '../memberships');
  
  try {
    // Check if memberships directory exists
    await fs.access(membershipsDir);
  } catch (error) {
    console.warn(`⚠️ [Membership PDF] Memberships directory not found: ${membershipsDir}`);
    return null;
  }

  // Normalize and clean inputs for matching
  // Handle "null" string case
  let cleanTier = membershipTier;
  if (cleanTier === 'null' || cleanTier === null || cleanTier === undefined || cleanTier === '') {
    cleanTier = null;
  }
  
  const normalizedName = membershipName ? membershipName.toLowerCase().trim() : '';
  const normalizedTier = cleanTier ? cleanTier.toLowerCase().trim() : '';
  
  console.log(`🔍 [Membership PDF] Searching for PDF - Name: "${membershipName}", Tier: "${cleanTier}"`);
  
  // Try to find matching PDF file
  let pdfPrefix = null;
  
  // Strategy 1: Match by tier first (most reliable)
  if (normalizedTier && normalizedTier !== 'null') {
    for (const [key, prefix] of Object.entries(MEMBERSHIP_PDF_MAP)) {
      if (normalizedTier === key || normalizedTier.includes(key) || key.includes(normalizedTier)) {
        pdfPrefix = prefix;
        console.log(`✅ [Membership PDF] Found match by tier: ${key} -> ${prefix}`);
        break;
      }
    }
  }
  
  // Strategy 2: Extract tier from Arabic name if tier is not available
  if (!pdfPrefix && normalizedName) {
    // Check Arabic name mapping
    for (const [arabicKey, tierKey] of Object.entries(ARABIC_NAME_TO_TIER)) {
      if (normalizedName.includes(arabicKey)) {
        // Found Arabic match, now find PDF prefix
        const matchedPrefix = MEMBERSHIP_PDF_MAP[tierKey];
        if (matchedPrefix) {
          pdfPrefix = matchedPrefix;
          console.log(`✅ [Membership PDF] Found match by Arabic name: "${arabicKey}" -> ${tierKey} -> ${matchedPrefix}`);
          break;
        }
      }
    }
  }
  
  // Strategy 3: Match by English name if tier didn't work
  if (!pdfPrefix && normalizedName) {
    for (const [key, prefix] of Object.entries(MEMBERSHIP_PDF_MAP)) {
      if (normalizedName.includes(key) || key.includes(normalizedName.split(' ')[0])) {
        pdfPrefix = prefix;
        console.log(`✅ [Membership PDF] Found match by name: ${key} -> ${prefix}`);
        break;
      }
    }
  }
  
  // Strategy 3: Try to find any file that contains the membership name or tier
  if (!pdfPrefix) {
    try {
      const files = await fs.readdir(membershipsDir);
      const searchTerms = [normalizedTier, normalizedName].filter(Boolean);
      
      // Enhanced matching: try multiple patterns
      for (const term of searchTerms) {
        if (!term) continue;
        
        // Try to find matching file with multiple strategies
        const matchingFile = files.find(file => {
          if (!file.endsWith('.pdf')) return false;
          
          const fileLower = file.toLowerCase();
          const filePrefix = file.split('_')[0].toLowerCase();
          
          // Strategy 3a: Exact prefix match
          if (filePrefix === term) return true;
          
          // Strategy 3b: File contains term
          if (fileLower.includes(term)) return true;
          
          // Strategy 3c: Term contains file prefix
          if (term.includes(filePrefix)) return true;
          
          // Strategy 3d: Check against MEMBERSHIP_PDF_MAP
          for (const [key, prefix] of Object.entries(MEMBERSHIP_PDF_MAP)) {
            if (filePrefix === prefix.toLowerCase() && term === key) {
              return true;
            }
          }
          
          return false;
        });
        
        if (matchingFile) {
          // Extract prefix from filename (e.g., "BusinessMembership_251209_034310.pdf" -> "BusinessMembership")
          pdfPrefix = matchingFile.split('_')[0];
          console.log(`✅ [Membership PDF] Found match by file search: ${matchingFile} -> ${pdfPrefix}`);
          break;
        }
      }
      
      // Strategy 4: If still not found, try direct file listing and match by tier/name
      if (!pdfPrefix && files.length > 0) {
        // List all PDF files and try to match
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));
        console.log(`🔍 [Membership PDF] Available PDF files: ${pdfFiles.join(', ')}`);
        
        // Try to match by checking if any file prefix matches our search terms
        for (const pdfFile of pdfFiles) {
          const filePrefix = pdfFile.split('_')[0].toLowerCase();
          
          // Check if this file matches our tier or name
          if (normalizedTier && filePrefix.includes(normalizedTier)) {
            pdfPrefix = pdfFile.split('_')[0];
            console.log(`✅ [Membership PDF] Found match by tier in filename: ${pdfFile} -> ${pdfPrefix}`);
            break;
          }
          
          if (normalizedName && filePrefix.includes(normalizedName)) {
            pdfPrefix = pdfFile.split('_')[0];
            console.log(`✅ [Membership PDF] Found match by name in filename: ${pdfFile} -> ${pdfPrefix}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error('❌ [Membership PDF] Error reading memberships directory:', error);
    }
  }
  
  if (!pdfPrefix) {
    console.warn(`⚠️ [Membership PDF] No PDF prefix found for Name: "${membershipName}", Tier: "${membershipTier}"`);
    return null;
  }
  
  // Find the actual PDF file (with timestamp suffix)
  try {
    const files = await fs.readdir(membershipsDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    
    console.log(`🔍 [Membership PDF] Searching for PDF with prefix: "${pdfPrefix}"`);
    console.log(`🔍 [Membership PDF] Available PDF files: ${pdfFiles.join(', ')}`);
    
    // Try exact prefix match first
    let pdfFile = pdfFiles.find(file => 
      file.startsWith(pdfPrefix) && file.endsWith('.pdf')
    );
    
    // If not found, try case-insensitive match
    if (!pdfFile) {
      pdfFile = pdfFiles.find(file => 
        file.toLowerCase().startsWith(pdfPrefix.toLowerCase()) && file.endsWith('.pdf')
      );
    }
    
    // If still not found, try partial match (for cases like "Gold" matching "GoldMembership")
    if (!pdfFile && pdfPrefix) {
      const prefixLower = pdfPrefix.toLowerCase();
      pdfFile = pdfFiles.find(file => {
        const filePrefix = file.split('_')[0].toLowerCase();
        return filePrefix.includes(prefixLower) || prefixLower.includes(filePrefix);
      });
    }
    
    if (pdfFile) {
      const fullPath = path.join(membershipsDir, pdfFile);
      console.log(`✅ [Membership PDF] Found PDF file: ${pdfFile}`);
      console.log(`✅ [Membership PDF] Full path: ${fullPath}`);
      return fullPath;
    } else {
      console.warn(`⚠️ [Membership PDF] Prefix "${pdfPrefix}" found but no matching PDF file exists`);
      console.warn(`⚠️ [Membership PDF] Available files: ${pdfFiles.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ [Membership PDF] Error finding PDF file:', error);
  }
  
  return null;
}

/**
 * Get PDF URL for a membership
 * @param {Object} membership - Membership object
 * @param {Object} req - Express request object
 * @returns {string|null} - PDF URL or null
 */
function getMembershipPDFUrl(membership, req) {
  if (!membership || !membership.name) return null;
  
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  
  // Return API endpoint URL for viewing PDF
  // The actual file will be found by the controller
  return `${protocol}://${host}/api/memberships/${membership.id}/pdf/view`;
}

/**
 * Get all available PDF files in memberships directory
 * @returns {Promise<Array>} - Array of PDF file names
 */
async function getAllMembershipPDFs() {
  const membershipsDir = path.join(__dirname, '../memberships');
  
  try {
    await fs.access(membershipsDir);
    const files = await fs.readdir(membershipsDir);
    return files.filter(file => file.endsWith('.pdf'));
  } catch (error) {
    console.warn(`⚠️ [Membership PDF] Memberships directory not found: ${membershipsDir}`);
    return [];
  }
}

/**
 * Link PDF files to memberships automatically
 * This function can be used to update memberships with PDF URLs
 * @param {Object} membership - Membership object
 * @returns {Promise<string|null>} - PDF file path or null
 */
async function linkPDFToMembership(membership) {
  if (!membership) return null;
  
  const pdfPath = await findMembershipPDF(membership.name, membership.tier);
  return pdfPath;
}

module.exports = {
  findMembershipPDF,
  getMembershipPDFUrl,
  getAllMembershipPDFs,
  linkPDFToMembership,
  MEMBERSHIP_PDF_MAP,
  ARABIC_NAME_TO_TIER
};

