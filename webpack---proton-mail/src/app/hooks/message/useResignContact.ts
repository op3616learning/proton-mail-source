import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences } from '@proton/components';
import { MessageExtended } from '../../models/message';
import { loadMessage } from '../../helpers/message/messageRead';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';

export const useResignContact = (localID: string) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const messageCache = useMessageCache();
    const api = useApi();

    return useCallback(async () => {
        const messageFromCache = messageCache.get(localID) as MessageExtended;
        const message = await loadMessage(messageFromCache, api);
        const address = message.data.Sender?.Address;
        if (!address || !messageFromCache.verification) {
            return;
        }
        const { isContactSignatureVerified } = await getEncryptionPreferences(address);
        updateMessageCache(messageCache, localID, {
            verification: {
                ...messageFromCache.verification,
                senderVerified: isContactSignatureVerified,
            },
        });
    }, [localID]);
};
