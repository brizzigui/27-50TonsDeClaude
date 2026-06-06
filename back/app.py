from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from openai import OpenAI

app = Flask(__name__)

# Configurações do Banco de Dados e JWT
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this-in-production'

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --- Modelos ---

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    pasture_areas = db.relationship('PastureArea', backref='user', lazy=True, cascade="all, delete-orphan")
    cattle_lot = db.relationship('CattleLot', backref='user', uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class PastureArea(db.Model):
    __tablename__ = 'pasture_areas'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    area_hectares = db.Column(db.Float, nullable=False)
    grass_type = db.Column(db.String(120))
    status = db.Column(db.String(50), default='descanso', nullable=False)
    last_estimated_biomass_kg = db.Column(db.Float)
    last_biomass_percent = db.Column(db.Float)
    last_measured_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    readings = db.relationship('PastureReading', backref='area', lazy=True, cascade="all, delete-orphan")


class CattleLot(db.Model):
    __tablename__ = 'cattle_lot'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    current_area_id = db.Column(db.Integer, db.ForeignKey('pasture_areas.id'))
    animal_category = db.Column(db.String(100))
    head_count = db.Column(db.Integer, nullable=False)
    average_weight_kg = db.Column(db.Float, nullable=False)
    target_weight_kg = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to current area
    current_area = db.relationship('PastureArea')


class PastureReading(db.Model):
    __tablename__ = 'pasture_readings'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pasture_area_id = db.Column(db.Integer, db.ForeignKey('pasture_areas.id', ondelete='CASCADE'), nullable=False)
    height_cm = db.Column(db.Float)
    image_path = db.Column(db.Text)
    green_percent = db.Column(db.Float)
    biomass_percent = db.Column(db.Float)
    recent_weather_condition = db.Column(db.String(100))
    estimated_biomass_kg = db.Column(db.Float)
    measured_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class MovementRecommendation(db.Model):
    __tablename__ = 'movement_recommendations'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    cattle_lot_id = db.Column(db.Integer, db.ForeignKey('cattle_lot.id', ondelete='CASCADE'), nullable=False)
    from_area_id = db.Column(db.Integer, db.ForeignKey('pasture_areas.id'))
    to_area_id = db.Column(db.Integer, db.ForeignKey('pasture_areas.id'))
    action_type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


def create_db():
    with app.app_context():
        db.create_all()
        
        # Initialize with a sample account if the database is empty
        if not User.query.first():
            print("Creating sample account and initial data...")
            sample_user = User(name='Produtor Exemplo', email='produtor@exemplo.com')
            sample_user.set_password('senha123')
            db.session.add(sample_user)
            db.session.commit()
            
            # Sample Pasture Areas
            p1 = PastureArea(user_id=sample_user.id, name='Piquete 01 - Baixada', area_hectares=12.0, grass_type='Azevém', last_estimated_biomass_kg=8500.0)
            p2 = PastureArea(user_id=sample_user.id, name='Piquete 02 - Morro', area_hectares=10.0, grass_type='Braquiária', last_estimated_biomass_kg=5000.0)
            p3 = PastureArea(user_id=sample_user.id, name='Piquete 03 - Sede', area_hectares=8.0, grass_type='Pânico', last_estimated_biomass_kg=2000.0)
            db.session.add_all([p1, p2, p3])
            db.session.commit()

            # Sample Cattle Lot
            lot = CattleLot(
                user_id=sample_user.id,
                current_area_id=p1.id,
                animal_category='Garrotes',
                head_count=35,
                average_weight_kg=320.0
            )
            db.session.add(lot)
            db.session.commit()
            print("Sample database initialized successfully!")

create_db()

# --- Endpoints de Autenticação ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({"msg": "Nome, email e senha são obrigatórios"}), 400

    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Usuário já existe"}), 400

    new_user = User(name=name, email=email)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "Usuário registrado com sucesso"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Email e senha são obrigatórios"}), 400

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"msg": "Credenciais inválidas"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token}), 200

# --- Endpoints da Aplicação ---

@app.route('/api/areas', methods=['POST'])
@jwt_required()
def create_area():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('name') or not data.get('area_hectares'):
         return jsonify({"msg": "Nome e área em hectares são obrigatórios"}), 400

    new_area = PastureArea(
        user_id=current_user_id,
        name=data.get('name'),
        area_hectares=data.get('area_hectares'),
        grass_type=data.get('grass_type')
    )

    db.session.add(new_area)
    db.session.commit()

    return jsonify({"msg": "Área criada com sucesso", "id": new_area.id}), 201

@app.route('/api/areas', methods=['GET'])
@jwt_required()
def get_areas():
    current_user_id = get_jwt_identity()
    areas = PastureArea.query.filter_by(user_id=current_user_id).all()
    
    areas_list = [{
        "id": a.id,
        "name": a.name,
        "area_hectares": a.area_hectares,
        "grass_type": a.grass_type,
        "status": a.status,
        "last_estimated_biomass_kg": a.last_estimated_biomass_kg,
        "last_biomass_percent": a.last_biomass_percent,
        "last_measured_at": a.last_measured_at.isoformat() if a.last_measured_at else None
    } for a in areas]

    return jsonify(areas_list), 200

@app.route('/api/lote', methods=['POST'])
@jwt_required()
def create_or_update_lote():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('head_count') or not data.get('average_weight_kg'):
        return jsonify({"msg": "Número de cabeças e peso médio são obrigatórios"}), 400

    lot = CattleLot.query.filter_by(user_id=current_user_id).first()
    
    if lot:
        # Update existing
        lot.current_area_id = data.get('current_area_id', lot.current_area_id)
        lot.animal_category = data.get('animal_category', lot.animal_category)
        lot.head_count = data.get('head_count', lot.head_count)
        lot.average_weight_kg = data.get('average_weight_kg', lot.average_weight_kg)
        lot.target_weight_kg = data.get('target_weight_kg', lot.target_weight_kg)
        msg = "Lote atualizado com sucesso"
    else:
        # Create new
        lot = CattleLot(
            user_id=current_user_id,
            current_area_id=data.get('current_area_id'),
            animal_category=data.get('animal_category'),
            head_count=data.get('head_count'),
            average_weight_kg=data.get('average_weight_kg'),
            target_weight_kg=data.get('target_weight_kg')
        )
        db.session.add(lot)
        msg = "Lote criado com sucesso"

    db.session.commit()
    return jsonify({"msg": msg}), 200

@app.route('/api/lote', methods=['GET'])
@jwt_required()
def get_lote():
    current_user_id = get_jwt_identity()
    lot = CattleLot.query.filter_by(user_id=current_user_id).first()

    if not lot:
        return jsonify({"msg": "Nenhum lote encontrado"}), 404

    return jsonify({
        "id": lot.id,
        "current_area_id": lot.current_area_id,
        "animal_category": lot.animal_category,
        "head_count": lot.head_count,
        "average_weight_kg": lot.average_weight_kg,
        "target_weight_kg": lot.target_weight_kg,
        "total_live_weight_kg": lot.head_count * lot.average_weight_kg
    }), 200

@app.route('/api/area/update', methods=['POST'])
@jwt_required()
def update_area():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    area_id = data.get('area_id')
    if not area_id:
        return jsonify({"msg": "area_id é obrigatório"}), 400

    area = PastureArea.query.filter_by(id=area_id, user_id=current_user_id).first()
    if not area:
        return jsonify({"msg": "Área não encontrada"}), 404

    # Extract info from request
    height_cm = data.get('height_cm')
    green_percent = data.get('green_percent')
    recent_weather = data.get('recent_weather_condition')
    image_base64 = data.get('image_base64')

    # Call OpenAI if image is provided
    if image_base64:
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key:
            try:
                client = OpenAI(api_key=api_key)
                
                # Format base64 to ensure it has the data URI prefix if it doesn't
                img_data = image_base64
                if not img_data.startswith("data:image"):
                    img_data = f"data:image/jpeg;base64,{image_base64}"
                    
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Você é um especialista em agronomia. Avalie a condição deste pasto e estime a qualidade geral (massa útil/verde). Responda APENAS com um número inteiro de 0 a 100, onde 0 significa degradado/seco e 100 significa excelente."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": img_data
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=10,
                    temperature=0.0  # Reduce unpredictability
                )
                
                ai_response = response.choices[0].message.content.strip()
                
                import re
                match = re.search(r'\b\d{1,3}\b', ai_response)
                if match:
                    parsed_value = float(match.group())
                    if 0 <= parsed_value <= 100:
                        green_percent = parsed_value
                    else:
                        print(f"Valor numérico fora do padrão (0-100) retornado pela LLM: {parsed_value}")
                else:
                    print(f"Não foi possível extrair número da resposta da LLM: '{ai_response}'")
            except Exception as e:
                print(f"Erro na API da OpenAI: {e}")
        else:
            print("OPENAI_API_KEY não configurada.")

    green_percent = green_percent if green_percent is not None else 50
    estimated_biomass_kg = area.area_hectares * height_cm * 180 * (green_percent/100)

    # Create reading
    reading = PastureReading(
        pasture_area_id=area.id,
        height_cm=height_cm,
        green_percent=green_percent,
        biomass_percent=green_percent,
        recent_weather_condition=recent_weather,
        estimated_biomass_kg=estimated_biomass_kg
    )
    db.session.add(reading)

    # Update area
    area.last_estimated_biomass_kg = estimated_biomass_kg
    area.last_biomass_percent = green_percent
    area.last_measured_at = datetime.utcnow()
    
    
    db.session.commit()

    return jsonify({
        "biomass_percent": green_percent,
        "estimated_biomass_kg": estimated_biomass_kg
    }), 200

# --- Constantes de Simulação ---

GDP_POR_CATEGORIA = {
    'garrotes': 0.8,
    'novilhas': 0.7,
    'vacas': 0.5,
}
GDP_DEFAULT = 0.6
CONSUMO_PERCENT_PV = 0.025       # 2.5% do peso vivo por dia
EFICIENCIA_PASTEJO = 0.50         # 50% da biomassa é utilizável
LIMITE_DIAS_SIMULACAO = 365
LIMITE_DIAS_SEM_TARGET = 180
DIAS_CRITICOS = 3                 # abaixo disso, precisa mover


def _gdp_base(categoria: str | None) -> float:
    """Retorna o ganho diário de peso base (kg/dia) para a categoria."""
    if not categoria:
        return GDP_DEFAULT
    return GDP_POR_CATEGORIA.get(categoria.lower().strip(), GDP_DEFAULT)


def _simular_rotacao(lot, areas_db):
    """
    Simula dia-a-dia o rotacionamento do rebanho pelos piquetes.

    Retorna:
        timeline: lista de eventos (mover, venda, alerta)
        weight_projection: lista de pontos semanais {date, day_offset, week, average_weight_kg}
        summary: dict com estimativas gerais
    """
    today = datetime.utcnow().date()

    # Estado inicial
    peso_medio = lot.average_weight_kg
    head_count = lot.head_count
    current_area_id = lot.current_area_id
    target_weight = lot.target_weight_kg
    gdp_base = _gdp_base(lot.animal_category)

    # Snapshot de biomassa de cada área (não altera o banco)
    area_map = {}          # id -> {name, biomassa_restante, biomass_percent}
    for a in areas_db:
        area_map[a.id] = {
            'name': a.name,
            'biomassa_restante': a.last_estimated_biomass_kg if a.last_estimated_biomass_kg else 0.0,
            'biomass_percent': a.last_biomass_percent if a.last_biomass_percent else 50.0,
        }

    max_dias = LIMITE_DIAS_SIMULACAO
    if not target_weight:
        max_dias = LIMITE_DIAS_SEM_TARGET

    timeline = []
    weight_projection = []
    event_id = 0
    sale_reached = False

    # Registrar ponto inicial (semana 0)
    weight_projection.append({
        'date': today.isoformat(),
        'day_offset': 0,
        'week': 0,
        'average_weight_kg': round(peso_medio, 1),
    })

    for dia in range(max_dias):
        data_atual = today + timedelta(days=dia)

        # --- Consumo ---
        peso_vivo_total = head_count * peso_medio
        consumo_diario = peso_vivo_total * CONSUMO_PERCENT_PV

        # Biomassa disponível na área atual
        area_info = area_map.get(current_area_id)
        if area_info:
            disponivel = area_info['biomassa_restante'] * EFICIENCIA_PASTEJO
            dias_restantes = disponivel / consumo_diario if consumo_diario > 0 else 999
        else:
            dias_restantes = 0

        # --- Precisa mover? ---
        if dias_restantes < DIAS_CRITICOS:
            # Buscar melhor área alternativa
            melhor_area_id = None
            melhor_dias = 0
            for aid, ainfo in area_map.items():
                if aid == current_area_id:
                    continue
                disp = ainfo['biomassa_restante'] * EFICIENCIA_PASTEJO
                d = disp / consumo_diario if consumo_diario > 0 else 0
                if d > melhor_dias:
                    melhor_dias = d
                    melhor_area_id = aid

            if melhor_area_id and melhor_dias >= DIAS_CRITICOS:
                event_id += 1
                from_name = area_info['name'] if area_info else 'Desconhecido'
                to_name = area_map[melhor_area_id]['name']
                timeline.append({
                    'id': event_id,
                    'date': data_atual.isoformat(),
                    'day_offset': dia,
                    'action': 'mover',
                    'from_area_id': current_area_id,
                    'from_area_name': from_name,
                    'to_area_id': melhor_area_id,
                    'to_area_name': to_name,
                    'message': f'Mover do {from_name} para {to_name}. Pasto atual suporta ~{int(dias_restantes)} dias.',
                    'reason': f'Biomassa restante insuficiente (< {DIAS_CRITICOS} dias)',
                })
                current_area_id = melhor_area_id
                area_info = area_map[current_area_id]
            else:
                # Sem área disponível — alerta
                if not timeline or timeline[-1].get('action') != 'alerta' or timeline[-1].get('day_offset') != dia:
                    event_id += 1
                    timeline.append({
                        'id': event_id,
                        'date': data_atual.isoformat(),
                        'day_offset': dia,
                        'action': 'alerta',
                        'from_area_id': current_area_id,
                        'from_area_name': area_info['name'] if area_info else 'Desconhecido',
                        'to_area_id': None,
                        'to_area_name': None,
                        'message': 'Nenhum piquete com massa suficiente. Avalie suplementação!',
                        'reason': 'Todas as áreas com biomassa insuficiente',
                    })

        # --- Deduzir consumo da biomassa ---
        if area_info:
            area_info['biomassa_restante'] = max(0, area_info['biomassa_restante'] - consumo_diario)

        # --- Ganho de peso ---
        bp = area_info['biomass_percent'] if area_info else 50.0
        gdp_efetivo = gdp_base * (bp / 100.0)
        peso_medio += gdp_efetivo

        # --- Verificar venda ---
        if target_weight and peso_medio >= target_weight:
            event_id += 1
            timeline.append({
                'id': event_id,
                'date': data_atual.isoformat(),
                'day_offset': dia,
                'action': 'venda',
                'from_area_id': current_area_id,
                'from_area_name': area_info['name'] if area_info else None,
                'to_area_id': None,
                'to_area_name': None,
                'message': f'Rebanho atingiu peso alvo de {target_weight} kg ({head_count} cabeças)',
                'reason': f'Peso médio projetado: {round(peso_medio, 1)} kg/cabeça',
            })
            sale_reached = True

            # Registrar último ponto de peso
            week_num = dia // 7 + 1
            weight_projection.append({
                'date': data_atual.isoformat(),
                'day_offset': dia,
                'week': week_num,
                'average_weight_kg': round(peso_medio, 1),
            })
            break

        # --- Registrar ponto semanal ---
        if dia > 0 and dia % 7 == 0:
            week_num = dia // 7
            weight_projection.append({
                'date': data_atual.isoformat(),
                'day_offset': dia,
                'week': week_num,
                'average_weight_kg': round(peso_medio, 1),
            })

    # --- Summary ---
    last_day = (len(weight_projection) - 1) * 7 if weight_projection else 0
    # Pegar o último dia real da simulação
    if timeline:
        last_event = timeline[-1]
        sim_end_day = last_event['day_offset']
    elif weight_projection:
        sim_end_day = weight_projection[-1]['day_offset']
    else:
        sim_end_day = 0

    total_moves = sum(1 for e in timeline if e['action'] == 'mover')

    summary = {
        'estimated_sale_date': (today + timedelta(days=sim_end_day)).isoformat() if sale_reached else None,
        'days_to_sale': sim_end_day if sale_reached else None,
        'estimated_final_weight_kg': round(peso_medio, 1),
        'total_moves': total_moves,
        'sale_reached': sale_reached,
        'simulation_days': sim_end_day,
    }

    return timeline, weight_projection, summary


@app.route('/api/evaluation', methods=['GET'])
@jwt_required()
def evaluation():
    current_user_id = get_jwt_identity()

    # Lot info
    lot = CattleLot.query.filter_by(user_id=current_user_id).first()
    if not lot:
        return jsonify({"msg": "Nenhum lote encontrado"}), 404

    # Areas
    areas = PastureArea.query.filter_by(user_id=current_user_id).all()
    areas_list = [{
        "id": a.id,
        "name": a.name,
        "area_hectares": a.area_hectares,
        "status": a.status,
        "last_estimated_biomass_kg": a.last_estimated_biomass_kg,
        "last_biomass_percent": a.last_biomass_percent
    } for a in areas]

    # Lot data for response
    current_area = PastureArea.query.get(lot.current_area_id) if lot.current_area_id else None
    lot_data = {
        "animal_category": lot.animal_category,
        "head_count": lot.head_count,
        "average_weight_kg": lot.average_weight_kg,
        "target_weight_kg": lot.target_weight_kg,
        "total_live_weight_kg": lot.head_count * lot.average_weight_kg,
        "current_area_id": lot.current_area_id,
        "current_area_name": current_area.name if current_area else None
    }

    # Simulação
    timeline = []
    weight_projection = []
    summary = {}

    if lot.current_area_id and areas:
        timeline, weight_projection, summary = _simular_rotacao(lot, areas)

    return jsonify({
        "lot": lot_data,
        "areas": areas_list,
        "timeline": timeline,
        "weight_projection": weight_projection,
        "summary": summary
    }), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
