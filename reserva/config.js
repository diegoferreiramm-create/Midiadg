// CONFIGURAÇÃO INICIAL
const urlSistema = "https://script.google.com/macros/s/AKfycbxeyoKG99zETrrx6BdF7--w_-1cVe-S0tctxKOAfgFFQ3_as64oRqONoditWtXWsrRF/exec";

let modoEdicao = false;
let idSendoEditado = null;
let alunoEncontradoGlobal = null;
let clicouNoBotaoSair = false; 

let usuarioLogadoParaLog = ""; 
let parceiroLogadoParaLog = "";

// MAPEAMENTO RÍGIDO
const colunasDef = [
  { label: "ID", idx: 1 }, { label: "CPF", idx: 2 }, { label: "NOME", idx: 3 },
  { label: "NASC", idx: 4 }, { label: "MUNICIPIO", idx: 5 }, { label: "TEL", idx: 6 },
  { label: "VIA", idx: 7 }, { label: "PARCEIRO", idx: 8 }, 
  { label: "ATENDENTE", idx: 10 }, 
  { label: "Nº BOLETO", idx: 11 }, 
  { label: "STATUS", idx: 12 },    
  { label: "MOTIVO", idx: 13 },    
  { label: "DT ATU", idx: 14 },    
  { label: "CARTEIRA", idx: 15 },  
  { label: "LOTE", idx: 16 },      
  { label: "EDITAR", idx: 17 }     
];

const colunasParaMarcar = ["ID", "CPF", "NOME", "NASC", "MUNICIPIO", "TEL", "ATENDENTE", "Nº BOLETO", "EDITAR"];

// CPF Helper
const CPF = {
  limpar(valor){ return valor.replace(/\D/g,''); },
  formatar(valor){
    let v = this.limpar(valor);
    v = v.slice(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2');
    v = v.replace(/(\d{3})(\d)/,'$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/,'$1-$2');
    return v;
  },
  validar(valor){
    let cpf = this.limpar(valor);
    if(cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma=0, resto;
    for(let i=1;i<=9;i++) soma+=parseInt(cpf.substring(i-1,i))*(11-i);
    resto=(soma*10)%11; if(resto===10||resto===11) resto=0;
    if(resto!=parseInt(cpf.substring(9,10))) return false;
    soma=0;
    for(let i=1;i<=10;i++) soma+=parseInt(cpf.substring(i-1,i))*(12-i);
    resto=(soma*10)%11; if(resto===10||resto===11) resto=0;
    return resto==parseInt(cpf.substring(10,11));
  }
};


// Validação de Boleto
const BOLETO = {
  // Remove tudo que não é número
  limpar(valor) {
    return valor.replace(/\D/g, '');
  },
  
  // Aplica máscara conforme o tipo
  formatar(valor) {
    let v = this.limpar(valor);
    
    if (v.length === 0) return '';
    
    // Boleto de 10 dígitos (começa com 4)
    if (v.length <= 10 && (v[0] === '4')) {
      v = v.slice(0, 10);
      // Formato: 1234 5678 90
      v = v.replace(/(\d{4})(\d)/, '$1 $2');
      v = v.replace(/(\d{4}) (\d{4})(\d)/, '$1 $2 $3');
      return v;
    }
    
    // Boleto de 16 dígitos (começa com 8)
    if (v.length <= 16 && (v[0] === '8')) {
      v = v.slice(0, 16);
      // Formato: 1234 5678 9012 3456
      v = v.replace(/(\d{4})(\d)/, '$1 $2');
      v = v.replace(/(\d{4}) (\d{4})(\d)/, '$1 $2 $3');
      v = v.replace(/(\d{4}) (\d{4}) (\d{4})(\d)/, '$1 $2 $3 $4');
      return v;
    }
    
    // Se não começar com 4 ou 8, só limita a 16
    v = v.slice(0, 16);
    return v;
  },
  
  // Valida o tamanho e primeiro dígito
  validar(valor) {
    const v = this.limpar(valor);
    if (v.length === 0) return false;
    
    // Tipo 1: 10 dígitos começando com 4
    if (v[0] === '4' && v.length === 10) return true;
    
    // Tipo 2: 16 dígitos começando com 8
    if (v[0] === '8' && v.length === 16) return true;
    
    return false;
  },
  
  // Retorna o tipo do boleto
  getTipo(valor) {
    const v = this.limpar(valor);
    if (v.length === 0) return null;
    if (v[0] === '4' && v.length === 10) return '10_DIGITOS';
    if (v[0] === '8' && v.length === 16) return '16_DIGITOS';
    return 'INVALIDO';
  }
};
