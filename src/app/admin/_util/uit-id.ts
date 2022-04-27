// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

export const UIT_ID_REGEX = '[A-Za-z0-9_\\-:!]{2,32}';
export const UIT_REFERENCE_REGEX = '([A-Za-z0-9]{2,31}\\.)?' + UIT_ID_REGEX;

/// === Other regular expressions ===

// Matches orthographies in the format: ^[abbreviation of orthography]
export const LEMMA_ORTHOGRAPHY = /\^\[[A-Za-z0-9,. ]+\]/g

// Matches the dialects' uitIDs written in double braces, like: ((l:dialect1, l:dialect2, l:dialect3))
// The UIT_ID_REGEX is dublicated here.
export const ORTHOGRAPHY = /\(\([A-Za-z0-9_\-:!]{2,32}(, [A-Za-z0-9_\-:!]{2,32}){0,31}\)\)/g;
