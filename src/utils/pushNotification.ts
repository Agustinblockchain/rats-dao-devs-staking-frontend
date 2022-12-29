import { Store as StoreNotifications } from 'react-notifications-component';

//---------------------------------------------------------------

export function pushSucessNotification(title: string, mesagge: any, swHash: Boolean = true) {
    var messageForNotification;

    if (swHash) {
        messageForNotification = "Ok! TxHash: " + mesagge;
    } else {
        messageForNotification = "Ok! " + mesagge;
    }

    StoreNotifications.addNotification({
        title: `${title}`,
        message: `${messageForNotification}`,
        type: "success",
        insert: "bottom",
        container: "bottom-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        width: 350,
        dismiss: {
            duration: 15000,
            onScreen: true,
            pauseOnHover: true
        }
    });
}
//---------------------------------------------------------------

export function pushWarningNotification(title: string, error: any) {
    StoreNotifications.addNotification({
        title: `${title}`,
        message: `Error! ${error?.info || error?.message || error || ''}`,
        type: "warning",
        insert: "bottom",
        container: "bottom-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        width: 350,

        dismiss: {
            duration: 15000,
            onScreen: true,
            pauseOnHover: true
        }
    });
}
