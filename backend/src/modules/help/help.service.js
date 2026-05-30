const prisma = require('../../config/prisma');

const getHelp = async (moduleKey, lang = 'en') => {
  const article = await prisma.moduleHelpArticle.findUnique({
    where: { moduleKey_lang: { moduleKey, lang } },
  });
  // Fall back to English if requested lang not found
  if (!article && lang !== 'en') {
    return prisma.moduleHelpArticle.findUnique({
      where: { moduleKey_lang: { moduleKey, lang: 'en' } },
    });
  }
  return article;
};

const getAllForModule = (moduleKey) =>
  prisma.moduleHelpArticle.findMany({
    where: { moduleKey },
    orderBy: { lang: 'asc' },
  });

const upsertHelp = (moduleKey, lang, { title, overview, sections, isPublished }) =>
  prisma.moduleHelpArticle.upsert({
    where: { moduleKey_lang: { moduleKey, lang } },
    update: { title: title ?? '', overview: overview ?? '', sections: sections ?? [], isPublished: isPublished ?? false },
    create: { moduleKey, lang, title: title ?? '', overview: overview ?? '', sections: sections ?? [], isPublished: isPublished ?? false },
  });

const deleteHelp = (moduleKey, lang) =>
  prisma.moduleHelpArticle.deleteMany({ where: { moduleKey, lang } });

module.exports = { getHelp, getAllForModule, upsertHelp, deleteHelp };
