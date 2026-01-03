// P4.4 - Message parser for @location:{markerId} tokens in chat messages

export interface LocationToken {
  type: 'location';
  markerId: string;
  displayText: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedMessage {
  original: string;
  parts: Array<{
    type: 'text' | 'location';
    content: string;
    markerId?: string;
  }>;
  locationTokens: LocationToken[];
}

/**
 * Parse message content to extract @location:{markerId} tokens
 * Format: @location:{uuid}
 * Example: "Check out @location:123e4567-e89b-12d3-a456-426614174000 for the issue"
 */
export function parseMessageForLocations(message: string): ParsedMessage {
  console.log('[parseMessageForLocations] Parsing message:', message);

  // Regex to match @location:{uuid} pattern
  const locationRegex = /@location:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

  const locationTokens: LocationToken[] = [];
  const parts: ParsedMessage['parts'] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Find all location tokens
  while ((match = locationRegex.exec(message)) !== null) {
    const fullMatch = match[0]; // @location:{uuid}
    const markerId = match[1]; // uuid
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;

    console.log('[parseMessageForLocations] Found location token:', { markerId, startIndex, endIndex });

    // Add text before this token
    if (startIndex > lastIndex) {
      const textContent = message.slice(lastIndex, startIndex);
      parts.push({
        type: 'text',
        content: textContent,
      });
    }

    // Add location token
    locationTokens.push({
      type: 'location',
      markerId,
      displayText: fullMatch,
      startIndex,
      endIndex,
    });

    parts.push({
      type: 'location',
      content: fullMatch,
      markerId,
    });

    lastIndex = endIndex;
  }

  // Add remaining text
  if (lastIndex < message.length) {
    parts.push({
      type: 'text',
      content: message.slice(lastIndex),
    });
  }

  // If no tokens found, return entire message as text
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: message,
    });
  }

  console.log('[parseMessageForLocations] Parsed:', { locationCount: locationTokens.length, parts: parts.length });

  return {
    original: message,
    parts,
    locationTokens,
  };
}

/**
 * Extract all marker IDs from a message
 */
export function extractMarkerIds(message: string): string[] {
  const parsed = parseMessageForLocations(message);
  return parsed.locationTokens.map(token => token.markerId);
}

/**
 * Replace location tokens with marker titles
 * Used for display purposes
 */
export function replaceLocationTokensWithTitles(
  message: string,
  markerTitles: Record<string, string>
): string {
  const parsed = parseMessageForLocations(message);

  let result = message;

  // Replace in reverse order to maintain string indices
  for (let i = parsed.locationTokens.length - 1; i >= 0; i--) {
    const token = parsed.locationTokens[i];
    const title = markerTitles[token.markerId] || 'Unknown Location';
    const replacement = `📍 ${title}`;

    result =
      result.slice(0, token.startIndex) +
      replacement +
      result.slice(token.endIndex);
  }

  return result;
}

/**
 * Check if message contains location tokens
 */
export function hasLocationTokens(message: string): boolean {
  const parsed = parseMessageForLocations(message);
  return parsed.locationTokens.length > 0;
}
