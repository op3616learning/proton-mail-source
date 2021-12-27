import TurndownService from 'turndown';

import { identity } from '@proton/shared/lib/helpers/function';

/**
 * Transform HTML to text
 * Append lines before the content if it starts with a Signature
 */
export const toText = (html: string, convertImages = false) => {
    const turndownService = new TurndownService({
        bulletListMarker: '-',
        strongDelimiter: '' as any,
        emDelimiter: '' as any,
        hr: '',
    });

    const replaceBreakLine = {
        filter: 'br',
        replacement(content: string, node: HTMLElement) {
            // It matches the new line of a signature
            if (node.parentElement?.nodeName === 'DIV' && node.parentElement.childElementCount === 1) {
                return !node.parentElement.textContent ? '\n\n' : '\n';
            }

            // ex <li>monique<br></li>
            if (node.parentElement?.lastChild === node && node.parentElement.textContent) {
                return node.parentElement.nodeName !== 'LI' ? '\n' : '';
            }

            return '\n\n';
        },
    } as TurndownService.Rule;

    const replaceImg = {
        filter: 'img',
        replacement(content: string, element: HTMLElement) {
            if (!convertImages) {
                return '';
            }

            const image = element as HTMLImageElement;

            // needed for the automatic conversion done by pgp/inline, otherwise the conversion happens and people forget that they have selected this for some contacts
            const attribute = image.alt || image.src;
            return attribute ? `[${attribute}]` : '';
        },
    } as TurndownService.Rule;

    const replaceAnchor = {
        filter: 'a',
        replacement(content: string, node: HTMLElement) {
            return node.textContent;
        },
    } as TurndownService.Rule;

    const replaceDiv = {
        filter: ['div'],
        replacement(content: string) {
            return content;
        },
    } as TurndownService.Rule;

    turndownService.use([
        () => turndownService.addRule('replaceAnchor', replaceAnchor),
        () => turndownService.addRule('replaceDiv', replaceDiv),
        () => turndownService.addRule('replaceImg', replaceImg),
        () => turndownService.addRule('replaceBreakLine', replaceBreakLine),
    ]);

    /**
     * Override turndown to NOT escape any HTML. For example MONO_TLS_PROVIDER -> MONO\_TLS\_PROVIDER.
     * Just return the value that is passed in.
     * Fixes https://github.com/ProtonMail/Angular/issues/6556
     */
    turndownService.escape = identity;

    const output = turndownService.turndown(html);

    return output;
};
