var longitud = 0;
const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
var error = '';
bus = new Vue();

Vue.component('registro-usuarios',{
	template: '#modal-registro',

	data(){
		return{
			nuevoNombre: '',
			nuevoApellidos: '',
			nuevoPoblacion: '',
			email2:null,
			password1:null,
			password2:null, 
			email: null,
			password: null,
			err:null, 
			aviso: null
		}
	},

	methods: {
		registro: function(){
			try{
				if (this.password1 !== this.password2) throw "Las contraseñas son diferentes";
				if (this.password1.length < 8) throw "La contraseña debe de tener mínimo 8 caracteres";
			}
			catch(e){
				this.err = e;
				bus.$emit('error',this.err);
				$('#error').modal('show');
				this.password1 = '';
				this.password2 = '';
			}
			finally{
				//Registrar usuario en Firebase
				this.email = this.email2;
				this.password = this.password1;
				auth.createUserWithEmailAndPassword(this.email,this.password)
					.then(() => {
						this.password1 = '';
						this.password2 = '';
						this.aviso = 'Usuario creado con éxito';
						bus.$emit('aviso',this.aviso);
						$('#registro').modal('hide');
						$('#aviso').modal('show');
						// Si el usuario ha sido creado, lo introducimos en la database
						var usuario = {
							nombre: this.nuevoNombre,
							apellidos: this.nuevoApellidos,
							correo: this.email,
							poblacion: this.nuevoPoblacion
						}
						console.log(usuario);
						db.ref('users/').push(usuario);

					});
			}
			

		}
	}
});

Vue.component('muestra-error',{
	template: '#modal-error',
	data(){
		return {
			error: null,
		}
	},
	created(){
		bus.$on('error',(error) =>{
			this.error = error;
		});
	}
});

Vue.component('muestra-aviso',{
	template: '#modal-aviso',

	data() {
		return {
			aviso: null,
		}
	},
	created() {
		bus.$on('aviso',(aviso) => this.aviso = aviso);
	}
});

Vue.component('nuevos-usuarios',{
	props: [
		'usuarios1',
		'nuevoNombre1',
		'nuevoApellidos1',
		'nuevoPoblacion1',
		'nuevoCorreo1'
	],
	template: '#nuevo-usuario',
	data(){
		return {
			usuarios: this.usuarios1,
			nuevoNombre: this.nuevoNombre1,
			nuevoApellidos: this.nuevoApellidos1,
			nuevoPoblacion: this.nuevoPoblacion1,
			nuevoCorreo: this.nuevoCorreo1,
			aviso: null
		}
	},
	methods: {
		writeUserData: function (e) {

			db.ref('users/').push({
			    nombre: this.nuevoNombre,
			    apellidos: this.nuevoApellidos,
			    poblacion: this.nuevoPoblacion,
			    correo: this.nuevoCorreo
			  })
				.then((data) => {
					this.usuarios = [];
					this.nuevoNombre='';
					this.nuevoApellidos='';
					this.nuevoPoblacion='';
					this.nuevoCorreo='';
					this.aviso = ('Nuevo usuario creado con éxito !!!!');
					bus.$emit('aviso',this.aviso);
					$('#aviso').modal('show');
				});

		},
	},
	computed: {

		todaLaInformacion(){
			
				return this.nuevoNombre && this.nuevoApellidos && this.nuevoPoblacion && this.nuevoCorreo;

		}
	}
});

Vue.component('edita-usuario',{
	props: ['usuarios'],
	template: '#modal-editarusuario',
	data() {
		return {
			usuarioEditado: [],
			usuarioFinalEditado: [],
			clave: null,
			nombreEditado: null,
			apellidoEditado: null,
			poblacionEditado: null,
			correoEditado: null,
			aviso: null,
			error:null
		}
	},

	methods: {
		modificarUsuario(){
			db.ref('users/' + this.clave).update(
				{nombre: this.nombreEditado,
				apellidos: this.apellidoEditado,
				poblacion: this.poblacionEditado,
				correo: this.correoEditado}
			).then(() =>{
				$('#edicion').modal('hide');
				this.aviso = 'Usuario editado con éxito !!!';
				bus.$emit('aviso',this.aviso);
				$('#aviso').modal('show');
			}).catch((e) => {
				$('#edicion').modal('hide');
				this.error = 'Ha ocurrido algún problema !!!';
				bus.$emit('error',this.error);
				$('#error').modal('show');
			this.usuarioEditado = usuarioEditado;
			this.nombreEditado = this.usuarioEditado.nombre;
			this.apellidoEditado = this.usuarioEditado.apellidos;
			this.poblacionEditado = this.usuarioEditado.poblacion;
			this.correoEditado = this.usuarioEditado.correo;
		});
	},
	
});

Vue.component('muestra-usuarios',{
	props: ['usuarios','logeado'],
	template: '#mostrar-usuarios',

	data(){
		return {
			nombre: '',
			apellidos: '',
			poblacion: '',
			correo: '',
			usuarioEditado: [],
			persona: null,
			login: this.logeado,
			aviso: null,
			err: null
		}
	},

	methods: {

		editarUsuario: function(clave){
			let i = this.usuarios.length;
			for (let a = 0; a < i; a++) {
				if (this.usuarios[a].key == clave) {
					this.usuarioEditado = this.usuarios[a];
				}
			}
			bus.$emit('editado',this.usuarioEditado,clave);
		},

		eliminarUsuario: function(key){
			db.ref('users/' + key).remove(() => {
				this.aviso = 'Usuario eliminado';
				bus.$emit('aviso',this.aviso);
				$('#aviso').modal('show');
				vm.$forceUpdate();
			}).catch((e) => {
				this.err = 'No se ha podido eliminar';
				bus.$emit('error',this.err);
				$('#error').modal('show');
			});
			
		},
	}

});

Vue.component('muestra-personas',{
	props: ['personas'],
	template: '#listar-personas'
});

var vm = new Vue({
	el: '#main',

	// Llamamos a la función 'peticionHttp' para obtener usuarios ficticios
	// desde una url (Random user).
	mounted() {
		this.peticionHttp();
	},

	// Referenciamos a la base de datos de Firebase y, con el evento 'on' escuchamos
	// si hay cambios en ella y llamamos a la función 'cargarUsuarios' para obtenerlos.
	created() {
		db.ref('users/')
			.on('value', snapshot => this.cargarUsuarios(snapshot.val()));
	},

	data: {
		personas: [],
		usuarios: [],
		nuevoNombre: '',
		nuevoApellidos: '',
		nuevoPoblacion: '',
		nuevoCorreo: '',
		email: '',
		password: '',
		email2: '',
		password1: '',
		password2: '',
		muestraUsuarios: false,
		creaUsuario: false,
		muestraPersonas: false,
		login: false,
		err: null,
		aviso: null
	},



	methods: {

		// Login Normal en firebase con usuario y contraseña
		loginNormal: function(email,password){
			auth.signInWithEmailAndPassword(this.email,this.password)
				.then(() => {
					this.login = true;
					this.email = '';
					this.password = '';
					$('#login').modal('hide');
					this.aviso = 'Has sido logueado con éxito.';
					bus.$emit('aviso',this.aviso);
					$('#aviso').modal('show');
				})
				.catch((error) =>{
					this.email = '';
					this.password = '';
					this.err = error.message;
					if (this.err == 'The password is invalid or the user does not have a password.'){
						this.err = 'La contraseña en inválida o el usuario no tiene contraseña.';
					}else if (this.err == 'There is no user record corresponding to this identifier. The user may have been deleted.'){
						this.err = 'El correo electrónico no existe.';
					}else{
						this.err = 'Ha ocurrido un problema.';
					}
					bus.$emit('error',this.err);
					$('#login').modal('hide');
					$('#error').modal('show');
				});
		},

		// Login con Google en firebase
		loginGoogle: function(){
			auth.signInWithPopup(provider).then((result) => {
				console.log(result.user);
				this.login = true;
			}).then(() => {
				this.aviso = 'Has sido logueado con éxito !!!';
				bus.$emit('aviso',this.aviso);
				$('#aviso').modal('show');
			}).catch((error) => {
				this.err = 'Ha ocurrido un error.';
				bus.$emit('error',this.err);
				$('#error').modal('show');
			 
			});
		},

		// Logout de firebase
		logout: function(){
			firebase.auth().signOut()
				.then(() => {
			    this.aviso = 'Has salido de la aplicación';
			    bus.$emit('aviso',this.aviso);
			    $('#aviso').modal('show');
				})
				.catch((error) => {
			    this.err = 'Ha ocurrido un error.';
				bus.$emit('error',this.err);
				$('#error').modal('show');
			});
			this.login = false;
		},

		// Con estas tres funciones establecemos variables a true o false
		// para mostrar o no ciertos elementos de la página
		crearUsuario: function(){
			this.creaUsuario = this.creaUsuario ? false : true;
			if (this.muestraUsuarios = true) this.muestraUsuarios = false;
			if (this.muestraPersonas = true) this.muestraPersonas = false;
		},

		listaUsuarios: function() {
			this.muestraUsuarios = this.muestraUsuarios ? false : true;
			if (this.creaUsuario) this.creaUsuario = false;
			if (this.muestraPersonas = true) this.muestraPersonas = false; 
		},

		listaPersonas: function(){
			this.muestraPersonas = this.muestraPersonas ? false : true;
			if (this.creaUsuario = true) this.creaUsuario = false;
			if (this.muestraUsuarios = true) this.muestraUsuarios = false;
		},

		// En 'created()' llamamos a esta función para introducir los usuarios de
		// firebase en el array 'usuarios[]'
		cargarUsuarios: function(users){
			this.usuarios = [];
			for (var key in users) {
				this.usuarios.push({
						nombre: users[key].nombre,
						apellidos: users[key].apellidos,
						poblacion: users[key].poblacion,
						correo: users[key].correo,
						key: key
				});
			}
		},

		nuevaPersona: function(e){
			e.preventDefault();
			this.personas.push({
					nombre: this.nuevoNombre,
					apellidos: this.nuevoApellidos,
					poblacion: this.nuevoPoblacion,
					correo: this.nuevoCorreo
				});
			writeUserData(nombre, apellidos, poblacion, correo);
			this.nuevoNombre='';
			this.nuevoApellidos='';
			this.nuevoPoblacion='';
			this.nuevoCorreo='';
		},

		// Obtener usuarios ficticios desde url con axios
		// y asociarlos al array 'personas[]'
		peticionHttp: function(){
			axios.get('https://randomuser.me/api/?results=20')
					.then((response) => { 
					this.personas = response.data.results;
					});

		}
	}, 
});

