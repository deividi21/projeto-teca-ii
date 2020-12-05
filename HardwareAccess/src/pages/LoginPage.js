import React from 'react';
import {
    StyleSheet, ScrollView, AsyncStorage,
    TextInput, View, Image, Button,
    KeyboardAvoidingView, ActivityIndicator, Alert
} from 'react-native';
import FormRow from '../components/FormRow';
import firebase from 'firebase';

export default class LoginPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            email: "",
            senha: "",
            isLoading: false,
            message: ""
        }
    }

    componentDidMount() {

        AsyncStorage.getItem('NT::UserData').then((user_data_json) => {
            let user_data = JSON.parse(user_data_json)
            if(user_data != null) {
                this.access(user_data)
            }
        });

        var firebaseConfig = {
            apiKey: "AIzaSyDb2EXD73JVzGgOLt7G2dggwUD6f7auag0",
            authDomain: "hardware-access.firebaseapp.com",
            databaseURL: "https://hardware-access.firebaseio.com",
            projectId: "hardware-access",
            storageBucket: "hardware-access.appspot.com",
            messagingSenderId: "1029915831444",
            appId: "1:1029915831444:web:5c249650676f7651df5881",
            measurementId: "G-SE51Z977BF"
          };
          // Initialize Firebase
          //firebase.initializeApp(firebaseConfig);
    }

    onChangeHandler(field, value) {
        this.setState({ [field]: value })
    }

    access(userData) {
        this.setState({ isLoading: false });
        AsyncStorage.setItem('NT::UserData', JSON.stringify(userData));
        this.props.navigation.replace('Camera');
    }

    login() {
        this.setState({ isLoading: true, message: '' });
        const { email, senha } = this.state;

        return firebase
            .auth()
            .signInWithEmailAndPassword(email, senha)
            .then(user => {
                this.access(user)
            })
            .catch (error => {
                this.setState({
                    message: this.getMsgByErrorCode(error.code),
                    isLoading: false
                })
            })
    }

    getRegister() {
        const {email, senha} = this.state;
        if (!email || !senha) {
            Alert.alert(
                "Cadastro!",
                "Para se cadastrar informe e-mail e senha"
            );
            return null;
        }
        Alert.alert(
            "Cadastro!",
            "Deseja cadastrar seu usuário com os dados informados?",
            [{
                text: "Cancelar",
                style: "cancel" // iOS
            },{
                text: "Cadastrar",
                onPress: () => {this.register()}
            }],
        );
    }

    register() {
        const {email, senha} = this.state;

        return firebase
            .auth()
            .createUserWithEmailAndPassword(email,senha)
            .then(user => {
                this.access(user);
            })
            .catch(error =>{
                this.setState({
                    message: this.getMsgByErrorCode(error.code),
                    isLoading: false
                });
            })
    }

    getMsgByErrorCode(errorCode) {
        switch (errorCode) {
            case "auth/wrong-password":
                return "Senha incorreta";
            case "auth/invalid-email":
                return "Email inválido";
            case "auth/user-not-found":
                return "Usuário não encontrado";
            case "auth/user-disabled":
                return "Usuário desativado";
            case "auth/email-already-in-use":
                return "Email já utilizado";
            case "auth/operation-not-allowed":
                return "Operação não permitida";
            case "auth/weak-password":
                return "Senha fraca";
            default:
                return errorCode.text();
        }
    }

    renderButton() {
        if (this.state.isLoading)
            return <ActivityIndicator size="large" style={styles.loading} />

        return (
            <View>
                <View style={styles.btn}>
                    <Button
                        title="Entrar"
                        color="#6542f4"
                        onPress={() => this.login()}
                    />
                </View>
                <View style={styles.btn}>
                    <Button
                        title="Cadastre-se"
                        color="#a08af7"
                        onPress={() => this.getRegister()}
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
                    <View style={styles.logoView}>
                        <Image
                            source={require('../img/logo.png')}
                            style={styles.logo}
                        />
                    </View>
                    <FormRow>
                        <TextInput
                            style={styles.input}
                            placeholder="user@email.com"
                            keyboardType="email-address"
                            value={this.state.email}
                            onChangeText={value => this.onChangeHandler('email', value)}
                        />
                    </FormRow>
                    <FormRow>
                        <TextInput
                            style={styles.input}
                            placeholder="*********"
                            secureTextEntry
                            onChangeText={value => this.onChangeHandler('senha', value)}
                        />
                    </FormRow>
                    { this.renderButton() }
                    { this.renderMessage() }
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
