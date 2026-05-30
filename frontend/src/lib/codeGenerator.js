export const generateCategoryCode = (name) => {
  const words = name.split(/[\s&,\-_]+/).filter(w => w.length > 1);
  const initials = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
  return `SYL-BC-${initials.padEnd(3, 'X').slice(0, 3)}`;
};

export const generateTypeInitials = (name) => {
  const words = name.split(/[\s&,\-_]+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('').padEnd(2, 'X');
};
