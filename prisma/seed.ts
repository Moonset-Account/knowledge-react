import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = {
  READ_DOCUMENTS: 'read:documents',
  CREATE_DOCUMENTS: 'create:documents',
  EDIT_DOCUMENTS: 'edit:documents',
  DELETE_DOCUMENTS: 'delete:documents',
  PUBLISH_DOCUMENTS: 'publish:documents',
  REVIEW_DOCUMENTS: 'review:documents',
  READ_COMMENTS: 'read:comments',
  CREATE_COMMENTS: 'create:comments',
  DELETE_OWN_COMMENTS: 'delete:own_comments',
  DELETE_ALL_COMMENTS: 'delete:all_comments',
  READ_USERS: 'read:users',
  CREATE_USERS: 'create:users',
  EDIT_USERS: 'edit:users',
  DELETE_USERS: 'delete:users',
  READ_ROLES: 'read:roles',
  CREATE_ROLES: 'create:roles',
  EDIT_ROLES: 'edit:roles',
  DELETE_ROLES: 'delete:roles',
  READ_CATEGORIES: 'read:categories',
  CREATE_CATEGORIES: 'create:categories',
  EDIT_CATEGORIES: 'edit:categories',
  DELETE_CATEGORIES: 'delete:categories',
  READ_TAGS: 'read:tags',
  CREATE_TAGS: 'create:tags',
  EDIT_TAGS: 'edit:tags',
  DELETE_TAGS: 'delete:tags',
  READ_LOGS: 'read:logs',
  READ_FEEDBACKS: 'read:feedbacks',
  ADMIN_DASHBOARD: 'admin:dashboard',
};

async function main() {
  console.log('开始种子数据...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      permissions: JSON.stringify(['*']),
      description: '超级管理员角色，拥有系统全部权限',
    },
    create: {
      name: 'ADMIN',
      description: '超级管理员角色，拥有系统全部权限',
      permissions: JSON.stringify(['*']),
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {
      description: '普通用户角色，可以浏览文章和发表评论',
      permissions: JSON.stringify([
        PERMISSIONS.READ_DOCUMENTS,
        PERMISSIONS.CREATE_COMMENTS,
        PERMISSIONS.DELETE_OWN_COMMENTS,
      ]),
    },
    create: {
      name: 'USER',
      description: '普通用户角色，可以浏览文章和发表评论',
      permissions: JSON.stringify([
        PERMISSIONS.READ_DOCUMENTS,
        PERMISSIONS.CREATE_COMMENTS,
        PERMISSIONS.DELETE_OWN_COMMENTS,
      ]),
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: {},
    create: {
      name: 'EDITOR',
      description: '编辑者角色，可以创建、编辑和发布文章',
      permissions: JSON.stringify([
        PERMISSIONS.READ_DOCUMENTS,
        PERMISSIONS.CREATE_DOCUMENTS,
        PERMISSIONS.EDIT_DOCUMENTS,
        PERMISSIONS.PUBLISH_DOCUMENTS,
        PERMISSIONS.READ_COMMENTS,
        PERMISSIONS.CREATE_COMMENTS,
        PERMISSIONS.DELETE_OWN_COMMENTS,
        PERMISSIONS.ADMIN_DASHBOARD,
      ]),
    },
  });

  const reviewerRole = await prisma.role.upsert({
    where: { name: 'REVIEWER' },
    update: {},
    create: {
      name: 'REVIEWER',
      description: '审核员角色，可以审核文章和管理评论',
      permissions: JSON.stringify([
        PERMISSIONS.READ_DOCUMENTS,
        PERMISSIONS.REVIEW_DOCUMENTS,
        PERMISSIONS.READ_COMMENTS,
        PERMISSIONS.DELETE_ALL_COMMENTS,
        PERMISSIONS.ADMIN_DASHBOARD,
      ]),
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'MODERATOR' },
    update: {},
    create: {
      name: 'MODERATOR',
      description: '版主角色，可以管理评论和用户',
      permissions: JSON.stringify([
        PERMISSIONS.READ_DOCUMENTS,
        PERMISSIONS.READ_COMMENTS,
        PERMISSIONS.DELETE_ALL_COMMENTS,
        PERMISSIONS.READ_USERS,
        PERMISSIONS.EDIT_USERS,
        PERMISSIONS.READ_FEEDBACKS,
        PERMISSIONS.ADMIN_DASHBOARD,
      ]),
    },
  });

  const authorRole = await prisma.role.upsert({
    where: { name: 'AUTHOR' },
    update: {},
    create: {
      name: 'AUTHOR',
      description: '作者角色，可以创建和编辑自己的文章',
      permissions: JSON.stringify([
        PERMISSIONS.READ_DOCUMENTS,
        PERMISSIONS.CREATE_DOCUMENTS,
        PERMISSIONS.EDIT_DOCUMENTS,
        PERMISSIONS.READ_COMMENTS,
        PERMISSIONS.CREATE_COMMENTS,
        PERMISSIONS.DELETE_OWN_COMMENTS,
      ]),
    },
  });

  console.log('角色创建完成:', adminRole.name, userRole.name, editorRole.name, reviewerRole.name, moderatorRole.name, authorRole.name);

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: hashedAdminPassword,
    },
    create: {
      name: '管理员',
      email: 'admin@example.com',
      password: hashedAdminPassword,
      roleId: adminRole.id,
    },
  });

  console.log('管理员账号创建完成:', adminUser.email);

  const hashedUserPassword = await bcrypt.hash('user123', 10);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password: hashedUserPassword,
    },
    create: {
      name: '普通用户',
      email: 'user@example.com',
      password: hashedUserPassword,
      roleId: userRole.id,
    },
  });

  console.log('普通用户账号创建完成:', regularUser.email);

  const categories = [
    {
      name: '技术文档',
      slug: 'technical-docs',
      description: '技术相关的文档和教程',
    },
    {
      name: '用户指南',
      slug: 'user-guide',
      description: '产品使用指南和帮助文档',
    },
    {
      name: 'API 文档',
      slug: 'api-docs',
      description: 'API 接口文档和开发参考',
    },
    {
      name: '最佳实践',
      slug: 'best-practices',
      description: '开发和运维最佳实践指南',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('分类创建完成');

  const tags = [
    { name: 'React', slug: 'react' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'Prisma', slug: 'prisma' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: '教程', slug: 'tutorial' },
    { name: '入门', slug: 'beginner' },
    { name: '进阶', slug: 'advanced' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log('标签创建完成');

  const techCategory = await prisma.category.findUnique({
    where: { slug: 'technical-docs' },
  });

  const apiCategory = await prisma.category.findUnique({
    where: { slug: 'api-docs' },
  });

  const reactTag = await prisma.tag.findUnique({
    where: { slug: 'react' },
  });

  const typescriptTag = await prisma.tag.findUnique({
    where: { slug: 'typescript' },
  });

  const nextjsTag = await prisma.tag.findUnique({
    where: { slug: 'nextjs' },
  });

  const tutorialTag = await prisma.tag.findUnique({
    where: { slug: 'tutorial' },
  });

  const articles = [
    {
      title: 'React 18 新特性详解',
      slug: 'react-18-new-features',
      excerpt: '本文详细介绍了 React 18 中的新特性，包括并发渲染、自动批处理、Suspense 改进等核心功能。',
      content: `# React 18 新特性详解

React 18 是 React 的一个重大版本更新，引入了许多令人兴奋的新特性。

## 1. 并发渲染 (Concurrent Rendering)

并发渲染是 React 18 最重要的新特性。它允许 React 同时准备多个版本的 UI。

### 主要特点

- **可中断的渲染**：渲染过程可以被更高优先级的更新中断
- **后台渲染**：新的 UI 可以在后台准备，而不会阻塞主线程
- **选择性水合**：在 SSR 中可以选择性地水合组件

## 2. 自动批处理 (Automatic Batching)

在 React 18 中，所有的状态更新都会自动批处理，不再局限于事件处理函数。

\`\`\`javascript
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 18 会自动批处理这两个更新
}
\`\`\`

## 3. Suspense 改进

Suspense 现在支持服务端渲染和流式传输。

### 服务端 Suspense

在服务端渲染中，Suspense 允许你展示一个 fallback，同时异步获取数据。

### 流式 HTML

React 18 支持流式 HTML 传输，可以逐步发送 HTML 到客户端。

## 4. 新的 Hooks

### useTransition

\`useTransition\` 用于标记非紧急的更新：

\`\`\`javascript
function App() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input onChange={handleChange} />
      {isPending && <Spinner />}
      <SearchResults query={query} />
    </div>
  );
}
\`\`\`

### useDeferredValue

\`useDeferredValue\` 用于延迟更新一个值：

\`\`\`javascript
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  return <SlowList query={deferredQuery} />;
}
\`\`\`

## 总结

React 18 带来了许多激动人心的新特性，使我们能够构建更快、更流畅的用户界面。`,
      published: true,
      categoryId: techCategory?.id,
      authorId: adminUser.id,
      tags: [reactTag, typescriptTag, tutorialTag],
    },
    {
      title: 'Next.js 13 App Router 入门指南',
      slug: 'nextjs-13-app-router-guide',
      excerpt: 'Next.js 13 引入了全新的 App Router，本文将带你了解如何使用这个新的路由系统来构建现代化的 React 应用。',
      content: `# Next.js 13 App Router 入门指南

Next.js 13 引入了全新的 App Router，这是对传统 Pages Router 的重大改进。

## 目录结构

App Router 使用 \`app/\` 目录来定义路由：

\`\`\`
app/
  page.tsx        # 首页
  layout.tsx      # 根布局
  loading.tsx     # 加载状态
  error.tsx       # 错误页面
  about/
    page.tsx      # /about 页面
  blog/
    [slug]/
      page.tsx    # /blog/:slug 动态路由
\`\`\`

## 服务端组件 (Server Components)

App Router 默认使用服务端组件：

\`\`\`typescript
// app/page.tsx
async function HomePage() {
  const posts = await getPosts();
  
  return (
    <div>
      <h1>最新文章</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default HomePage;
\`\`\`

## 客户端组件 (Client Components)

需要使用交互性或浏览器 API 时，使用 \`'use client'\` 指令：

\`\`\`typescript
'use client';

import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

## 布局 (Layouts)

布局用于在多个页面间共享 UI：

\`\`\`typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
\`\`\`

## 数据获取

### 服务端组件中的数据获取

\`\`\`typescript
async function getPost(slug: string) {
  const res = await fetch(\`https://api.example.com/posts/\${slug}\`, {
    next: { revalidate: 60 } // ISR: 60秒后重新验证
  });
  return res.json();
}
\`\`\`

### 静态参数生成

\`\`\`typescript
export async function generateStaticParams() {
  const posts = await getPosts();
  
  return posts.map(post => ({
    slug: post.slug,
  }));
}
\`\`\`

## 总结

Next.js 13 的 App Router 提供了更强大的数据获取能力、更好的性能和更清晰的代码组织方式。`,
      published: true,
      categoryId: techCategory?.id,
      authorId: adminUser.id,
      tags: [nextjsTag, reactTag, tutorialTag],
    },
    {
      title: 'Prisma 数据库操作完全指南',
      slug: 'prisma-database-guide',
      excerpt: 'Prisma 是一个现代化的 TypeScript ORM，本文将详细介绍如何使用 Prisma 进行数据库操作。',
      content: `# Prisma 数据库操作完全指南

Prisma 是一个现代化的 TypeScript ORM，提供了类型安全的数据访问方式。

## 安装

\`\`\`bash
npm install prisma @prisma/client
npx prisma init
\`\`\`

## Schema 定义

\`\`\`prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(cuid())
  name  String
  email String @unique
  posts Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
\`\`\`

## 运行迁移

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

## 基本查询

### 创建客户端

\`\`\`typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
\`\`\`

### 创建数据

\`\`\`typescript
const user = await prisma.user.create({
  data: {
    name: '张三',
    email: 'zhangsan@example.com',
  },
});
\`\`\`

### 批量创建

\`\`\`typescript
const users = await prisma.user.createMany({
  data: [
    { name: '张三', email: 'zhangsan@example.com' },
    { name: '李四', email: 'lisi@example.com' },
  ],
});
\`\`\`

### 查询数据

\`\`\`typescript
// 获取所有用户
const users = await prisma.user.findMany();

// 获取单个用户
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
});

// 条件查询
const activeUsers = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
});
\`\`\`

### 更新数据

\`\`\`typescript
const updatedUser = await prisma.user.update({
  where: { id: 'user-id' },
  data: { name: '新名称' },
});
\`\`\`

### 删除数据

\`\`\`typescript
const deletedUser = await prisma.user.delete({
  where: { id: 'user-id' },
});
\`\`\`

## 关系查询

### 包含关联数据

\`\`\`typescript
const userWithPosts = await prisma.user.findUnique({
  where: { id: 'user-id' },
  include: {
    posts: true,
  },
});
\`\`\`

### 嵌套查询

\`\`\`typescript
const user = await prisma.user.create({
  data: {
    name: '张三',
    email: 'zhangsan@example.com',
    posts: {
      create: [
        { title: '第一篇文章', content: '内容...' },
        { title: '第二篇文章', content: '内容...' },
      ],
    },
  },
});
\`\`\`

## 事务

\`\`\`typescript
const [user, post] = await prisma.$transaction([
  prisma.user.create({
    data: { name: '张三', email: 'zhangsan@example.com' },
  }),
  prisma.post.create({
    data: {
      title: '新文章',
      content: '内容...',
      authorId: 'user-id',
    },
  }),
]);
\`\`\`

## 原始查询

\`\`\`typescript
const result = await prisma.$queryRaw\`
  SELECT * FROM User WHERE name = \${name}
\`;
\`\`\`

## 总结

Prisma 提供了类型安全、直观的 API，让数据库操作变得简单而优雅。`,
      published: true,
      categoryId: apiCategory?.id,
      authorId: adminUser.id,
      tags: [typescriptTag, tutorialTag],
    },
  ];

  for (const article of articles) {
    const existingDoc = await prisma.document.findUnique({
      where: { slug: article.slug },
    });

    if (!existingDoc) {
      const doc = await prisma.document.create({
        data: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          published: article.published,
          categoryId: article.categoryId,
          authorId: article.authorId,
          tags: {
            create: article.tags
              .filter((t): t is NonNullable<typeof t> => t !== null && t !== undefined)
              .map((tag) => ({
                tagId: tag.id,
              })),
          },
        },
      });
      console.log('文章创建完成:', doc.title);
    }
  }

  console.log('种子数据完成!');
  console.log('\n=== 默认账号 ===');
  console.log('管理员账号: admin@example.com / admin123');
  console.log('普通用户账号: user@example.com / user123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
