import { isMac, isSafari as checkIsSafari } from '@proton/shared/lib/helpers/browser';
import { noop } from '@proton/shared/lib/helpers/function';
import { RefObject, useRef } from 'react';
import { useHandler, useHotkeys, useMailSettings } from '@proton/components';

export interface ComposerHotkeysHandlers {
    composerRef: RefObject<HTMLDivElement>;
    handleClose: () => Promise<void>;
    handleSend: () => Promise<void>;
    handleDelete: () => Promise<void>;
    handleManualSave: () => Promise<void>;
    toggleMinimized: () => void;
    toggleMaximized: () => void;
    handlePassword: () => void;
    handleExpiration: () => void;
    lock: boolean;
    saving: boolean;
}

export const useComposerHotkeys = ({
    composerRef,
    handleClose,
    handleSend,
    handleDelete,
    handleManualSave,
    toggleMaximized,
    toggleMinimized,
    handlePassword,
    handleExpiration,
    lock,
    saving,
}: ComposerHotkeysHandlers) => {
    const isSafari = checkIsSafari();

    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const attachmentTriggerRef = useRef<() => void>(noop);

    const keyHandlers = {
        close: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            await handleClose();
        },
        send: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!lock) {
                await handleSend();
            }
        },
        delete: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            await handleDelete();
        },
        save: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!saving && !lock) {
                await handleManualSave();
            }
        },
        minimize: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMinimized();
        },
        maximize: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMaximized();
        },
        addAttachment: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            attachmentTriggerRef.current?.();
        },
        encrypt: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handlePassword();
        },
        addExpiration: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handleExpiration();
        },
    };

    const ctrlOrMetaKey = (e: KeyboardEvent) => (isMac() ? e.metaKey : e.ctrlKey);

    const squireKeydownHandler = useHandler(async (e: KeyboardEvent) => {
        if (!e.key) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'escape':
                if (Shortcuts) {
                    await keyHandlers?.close(e);
                }
                break;
            case 'enter':
                if (Shortcuts && ctrlOrMetaKey(e)) {
                    await keyHandlers?.send(e);
                }
                break;
            case 'backspace':
                if (Shortcuts && ctrlOrMetaKey(e) && e.altKey) {
                    await keyHandlers?.delete(e);
                }
                break;
            case 's':
                if (Shortcuts && ctrlOrMetaKey(e)) {
                    await keyHandlers?.save(e);
                }
                break;
            case 'm':
                if (!isSafari && Shortcuts && ctrlOrMetaKey(e)) {
                    if (e.shiftKey) {
                        keyHandlers?.maximize(e);
                        return;
                    }
                    keyHandlers?.minimize(e);
                }
                break;
            case 'a':
                if (Shortcuts && ctrlOrMetaKey(e) && e.shiftKey) {
                    keyHandlers?.addAttachment(e);
                }
                break;
            case 'e':
                if (Shortcuts && ctrlOrMetaKey(e) && e.shiftKey) {
                    keyHandlers?.encrypt(e);
                }
                break;
            case 'x':
                if (Shortcuts && ctrlOrMetaKey(e) && e.shiftKey) {
                    keyHandlers?.addExpiration(e);
                }
                break;
            default:
                break;
        }
    });

    useHotkeys(composerRef, [
        [['Escape'], keyHandlers.close],
        [['Meta', 'Enter'], keyHandlers.send],
        [['Meta', 'Alt', 'Backspace'], keyHandlers.delete],
        [['Meta', 'S'], keyHandlers.save],
        [
            ['Meta', 'M'],
            (e) => {
                if (!isSafari) {
                    keyHandlers.minimize(e);
                }
            },
        ],
        [
            ['Meta', 'Shift', 'M'],
            (e) => {
                if (!isSafari) {
                    keyHandlers.maximize(e);
                }
            },
        ],
        [['Meta', 'Shift', 'A'], keyHandlers.addAttachment],
        [['Meta', 'Shift', 'E'], keyHandlers.encrypt],
        [['Meta', 'Shift', 'X'], keyHandlers.addExpiration],
    ]);

    return { composerRef, squireKeydownHandler, attachmentTriggerRef };
};
