import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; versionId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { versionId } = await params;

        const version = await prisma.documentVersion.findUnique({
            where: { id: versionId },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });

        if (!version) {
            return NextResponse.json({ error: '版本不存在' }, { status: 404 });
        }

        return NextResponse.json({ version });
    } catch (error) {
        console.error('获取版本失败:', error);
        return NextResponse.json({ error: '获取版本失败' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; versionId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { id, versionId } = await params;

        const version = await prisma.documentVersion.findUnique({
            where: { id: versionId },
        });

        if (!version) {
            return NextResponse.json({ error: '版本不存在' }, { status: 404 });
        }

        if (version.documentId !== id) {
            return NextResponse.json({ error: '版本与文档不匹配' }, { status: 400 });
        }

        const currentDoc = await prisma.document.findUnique({
            where: { id },
            include: { tags: true, accessRoles: true },
        });

        if (!currentDoc) {
            return NextResponse.json({ error: '文档不存在' }, { status: 404 });
        }

        const maxVersion = await prisma.documentVersion.aggregate({
            where: { documentId: id },
            _max: { version: true },
        });

        const nextVersion = (maxVersion._max.version || 0) + 1;

        const tagIds = currentDoc.tags.map((t) => t.tagId);
        const roleIds = currentDoc.accessRoles.map((r) => r.id);

        await prisma.documentVersion.create({
            data: {
                documentId: id,
                version: nextVersion,
                title: currentDoc.title,
                content: currentDoc.content,
                excerpt: currentDoc.excerpt,
                slug: currentDoc.slug,
                categoryId: currentDoc.categoryId,
                published: currentDoc.published,
                tagIds: JSON.stringify(tagIds),
                roleIds: JSON.stringify(roleIds),
                authorId: user.id,
            },
        });

        const finalSlug = version.slug || generateSlug(version.title);
        const slugDoc = await prisma.document.findUnique({
            where: { slug: finalSlug },
        });

        if (slugDoc && slugDoc.id !== id) {
            return NextResponse.json({ error: '回滚失败：别名已存在' }, { status: 400 });
        }

        const versionTagIds: string[] = JSON.parse(version.tagIds || '[]');
        const versionRoleIds: string[] = JSON.parse(version.roleIds || '[]');

        const rolledBackDoc = await prisma.document.update({
            where: { id },
            data: {
                title: version.title,
                content: version.content,
                excerpt: version.excerpt,
                slug: finalSlug,
                categoryId: version.categoryId,
                published: version.published,
                tags: {
                    deleteMany: {},
                    create: versionTagIds.map((tagId: string) => ({
                        tagId,
                    })) || [],
                },
                accessRoles: versionRoleIds
                    ? {
                        set: versionRoleIds.map((rid: string) => ({ id: rid })),
                    }
                    : undefined,
            },
            include: {
                tags: { include: { tag: true } },
                category: true,
                accessRoles: true,
            },
        });

        return NextResponse.json({ document: rolledBackDoc, version: nextVersion });
    } catch (error) {
        console.error('回滚版本失败:', error);
        return NextResponse.json({ error: '回滚版本失败' }, { status: 500 });
    }
}
