from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
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

@app.route('/api/evaluation', methods=['GET'])
@jwt_required()
def evaluation():
    current_user_id = get_jwt_identity()
    
    # Lot info
    lot = CattleLot.query.filter_by(user_id=current_user_id).first()
    lot_data = None
    if lot:
        lot_data = {
            "animal_category": lot.animal_category,
            "head_count": lot.head_count,
            "average_weight_kg": lot.average_weight_kg,
            "total_live_weight_kg": lot.head_count * lot.average_weight_kg,
            "current_area_id": lot.current_area_id
        }

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

    recommendations = []
    if lot and lot.current_area_id:
        current_area = PastureArea.query.get(lot.current_area_id)
        if current_area:
            action = 'manter'
            message = 'Manter na área atual.'
            target_area_id = None
            
            estimated_biomass_kg = current_area.last_estimated_biomass_kg
            
            if estimated_biomass_kg is not None:
                # A biomassa estimada representa a Matéria Seca total em kg.
                # Consumo diário do lote estimado em 2.5% do peso vivo.
                total_live_weight_kg = lot.head_count * lot.average_weight_kg
                daily_intake = total_live_weight_kg * 0.025
                
                # Assumimos uma eficiência de pastejo de 50% (metade fica de resíduo para a planta rebrotar)
                available_intake = estimated_biomass_kg * 0.5
                
                days_remaining = available_intake / daily_intake if daily_intake > 0 else 999
                
                if days_remaining < 3:
                    # Crítico: Menos de 3 dias de pasto, precisa mover!
                    candidate_areas = PastureArea.query.filter(
                        PastureArea.user_id == current_user_id,
                        PastureArea.id != current_area.id
                    ).order_by(PastureArea.id.asc()).all()
                    
                    best_target = None
                    for area in candidate_areas:
                        if area.last_estimated_biomass_kg is not None:
                            area_days = (area.last_estimated_biomass_kg * 0.5) / daily_intake if daily_intake > 0 else 999
                            if area_days >= 7:  # A próxima área precisa ter pelo menos 7 dias de comida
                                best_target = area
                                break
                    
                    if best_target:
                        action = 'mover'
                        target_area_id = best_target.id
                        message = f'Mover do {current_area.name} para o {best_target.name}. Pasto atual suporta apenas ~{int(days_remaining)} dias.'
                    else:
                        action = 'medir'
                        message = f'Pasto crítico (~{int(days_remaining)} dias), mas nenhum piquete na rotação tem massa suficiente. Avalie suplementar!'
                        
                elif days_remaining < 7:
                    # Atenção: Pasto acabando na próxima semana
                    action = 'medir'
                    message = f'Atenção: restam aprox. {int(days_remaining)} dias de pasto útil. Planeje a rotação e meça os próximos piquetes.'
                else:
                    # Excelente: Pasto farto
                    action = 'manter'
                    message = f'Manter na área. Pasto estimado para mais {int(days_remaining)} dias com o lote atual.'
            else:
                action = 'medir'
                message = 'Sem dados recentes da área atual. Atualize a leitura com uma foto.'

            latest_recommendation = MovementRecommendation.query.filter_by(
                user_id=current_user_id,
                cattle_lot_id=lot.id
            ).order_by(MovementRecommendation.created_at.desc()).first()

            should_save_recommendation = (
                latest_recommendation is None or
                latest_recommendation.action_type != action or
                latest_recommendation.from_area_id != current_area.id or
                latest_recommendation.to_area_id != target_area_id or
                latest_recommendation.message != message
            )

            if should_save_recommendation:
                latest_recommendation = MovementRecommendation(
                    user_id=current_user_id,
                    cattle_lot_id=lot.id,
                    from_area_id=current_area.id,
                    to_area_id=target_area_id,
                    action_type=action,
                    message=message
                )
                db.session.add(latest_recommendation)
                db.session.commit()

            recommendations.append({
                "id": latest_recommendation.id if latest_recommendation else None,
                "date": datetime.utcnow().isoformat(),
                "action": action,
                "message": message,
                "from_area_id": current_area.id,
                "to_area_id": target_area_id
            })

    return jsonify({
        "lot": lot_data,
        "areas": areas_list,
        "last_recommendations": recommendations
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
