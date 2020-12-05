import React from 'react';
import { StyleSheet, ScrollView, View, Button, KeyboardAvoidingView, ActivityIndicator, Alert } from 'react-native';
import { UsbSerial} from 'react-native-usbserial';

const usbs = new UsbSerial();

async function getDeviceAsync() {

    try {
        const deviceList = await usbs.getDeviceListAsync();
        const firstDevice = deviceList[0];
        
        console.log(firstDevice);
        console.log("teste");

        if (firstDevice) {
            const usbSerialDevice = await usbs.openDeviceAsync(firstDevice);
            
            console.log(usbSerialDevice);
        }
    } catch (err) {
        console.warn(err);
    }
}




export default class CameraPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {

        }
    }

    componentDidMount() {

    }

    receberCom() {
        getDeviceAsync();
    }

    renderButton() {
        if (this.state.isLoading)
            return <ActivityIndicator size="large" style={styles.loading} />

        return (
            <View>
                <View style={styles.btn}>
                    <Button
                        title="Receber"
                        color="#6542f4"
                        onPress={() => this.receberCom()}
                    />
                </View>
                <View style={styles.btn}>
                    <Button
                        title="Enviar"
                        color="#a08af7"
                    //onPress={() => this.getRegister()}
                    />
                </View>
            </View>
        )
    }


    renderMessage() {
        const { message } = this.state;
        if (!message)
            return null;

        Alert.alert(
            "Erro!",
            message.toString(),
            [{
                text: 'OK',
                onPress: () => { this.setState({ message: '' }); }
            }]
        );
    }

    render() {
        return (
            <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={styles.container}>
                    {this.renderButton()}
                    {this.renderMessage()}
                </ScrollView>
            </KeyboardAvoidingView>
        )
    }
};

const styles = StyleSheet.create({
    container: {
        paddingRight: 10,
        paddingLeft: 10,
        backgroundColor: "#dbd5d5"
    },
    input: {
        paddingLeft: 5,
        paddingRight: 5
    },
    btn: {
        paddingTop: 20,
        fontSize: 11
    },
    logo: {
        aspectRatio: 1,
        resizeMode: 'center',
        width: 400,
        height: 400
    },
    logoView: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    loading: {
        padding: 2
    }
});
